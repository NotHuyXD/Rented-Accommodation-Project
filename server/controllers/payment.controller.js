// ============================================================
// Payment Controller - Invoices, Transactions, Wallets
// ============================================================
const { query, getConnection } = require('../config/db');
const { generateUUID, generateCode, paginate } = require('../utils/helpers');

async function listInvoices(req, res, next) {
  try {
    const { page = 1, limit = 20, status, billingYear, billingMonth } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (req.user.role === 'landlord') {
      whereClause += ' AND i.landlord_id = ?'; params.push(req.user.id);
    } else if (req.user.role !== 'admin') {
      whereClause += ' AND i.tenant_id = ?'; params.push(req.user.id);
    }
    if (status) { whereClause += ' AND i.status = ?'; params.push(status); }
    if (billingYear) { whereClause += ' AND i.billing_year = ?'; params.push(parseInt(billingYear)); }
    if (billingMonth) { whereClause += ' AND i.billing_month = ?'; params.push(parseInt(billingMonth)); }

    const countResult = await query(`SELECT COUNT(*) as total FROM invoices i ${whereClause}`, [...params]);
    const total = countResult[0]?.total || 0;

    params.push(parseInt(limit), offset);
    const invoices = await query(
      `SELECT i.*, r.title as room_title, r.address as room_address,
              t.full_name as tenant_name, l.full_name as landlord_name
       FROM invoices i
       JOIN rooms r ON i.room_id = r.id
       JOIN users t ON i.tenant_id = t.id
       JOIN users l ON i.landlord_id = l.id
       ${whereClause} ORDER BY i.billing_year DESC, i.billing_month DESC LIMIT ? OFFSET ?`, params
    );

    res.json(paginate(invoices, page, limit, total));
  } catch (error) { next(error); }
}

async function getInvoiceById(req, res, next) {
  try {
    const invoices = await query(
      `SELECT i.*, r.title as room_title, r.address as room_address,
              t.full_name as tenant_name, t.phone as tenant_phone,
              l.full_name as landlord_name, l.phone as landlord_phone
       FROM invoices i
       JOIN rooms r ON i.room_id = r.id
       JOIN users t ON i.tenant_id = t.id
       JOIN users l ON i.landlord_id = l.id
       WHERE i.id = ?`, [req.params.id]
    );
    if (invoices.length === 0) return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });

    const items = await query('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order', [req.params.id]);
    res.json({ data: { ...invoices[0], items } });
  } catch (error) { next(error); }
}

async function createInvoice(req, res, next) {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const {
      tenantId, roomId, contractId, billingMonth, billingYear, dueDate,
      rentAmount, utilityAmount = 0, serviceAmount = 0, otherAmount = 0,
      discountAmount = 0, note, items = []
    } = req.body;

    const invoiceId = generateUUID();
    const invoiceNumber = generateCode('INV', 8);
    const totalAmount = rentAmount + utilityAmount + serviceAmount + otherAmount - discountAmount;

    await conn.execute(
      `INSERT INTO invoices 
       (id, invoice_number, tenant_id, landlord_id, room_id, contract_id,
        billing_month, billing_year, due_date,
        rent_amount, utility_amount, service_amount, other_amount, discount_amount, total_amount,
        status, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent', ?)`,
      [invoiceId, invoiceNumber, tenantId, req.user.id, roomId, contractId || null,
       billingMonth, billingYear, dueDate,
       rentAmount, utilityAmount, serviceAmount, otherAmount, discountAmount, totalAmount,
       note || null]
    );

    // Insert items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await conn.execute(
        `INSERT INTO invoice_items (id, invoice_id, item_type, description, previous_reading, current_reading, usage_amount, unit_price, unit, amount, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [generateUUID(), invoiceId, item.itemType, item.description,
         item.previousReading || null, item.currentReading || null, item.usageAmount || null,
         item.unitPrice || null, item.unit || null, item.amount, i]
      );
    }

    // Notify tenant
    await conn.execute(
      `INSERT INTO notifications (id, user_id, type, title, body, entity_type, entity_id, sender_id)
       VALUES (?, ?, 'payment_reminder', 'Hóa đơn mới', ?, 'invoice', ?, ?)`,
      [generateUUID(), tenantId, `Hóa đơn tháng ${billingMonth}/${billingYear}: ${totalAmount.toLocaleString()}đ`,
       invoiceId, req.user.id]
    );

    await conn.commit();
    res.status(201).json({ message: 'Tạo hóa đơn thành công', data: { id: invoiceId, invoiceNumber } });
  } catch (error) { await conn.rollback(); next(error); } finally { conn.release(); }
}

async function listTransactions(req, res, next) {
  try {
    const { page = 1, limit = 20, status, paymentType } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE (t.payer_id = ? OR t.payee_id = ?)';
    const params = [req.user.id, req.user.id];

    if (status) { whereClause += ' AND t.status = ?'; params.push(status); }
    if (paymentType) { whereClause += ' AND t.payment_type = ?'; params.push(paymentType); }

    const countResult = await query(`SELECT COUNT(*) as total FROM transactions t ${whereClause}`, [...params]);
    const total = countResult[0]?.total || 0;

    params.push(parseInt(limit), offset);
    const transactions = await query(
      `SELECT t.*, payer.full_name as payer_name, payee.full_name as payee_name
       FROM transactions t
       JOIN users payer ON t.payer_id = payer.id
       JOIN users payee ON t.payee_id = payee.id
       ${whereClause} ORDER BY t.created_at DESC LIMIT ? OFFSET ?`, params
    );

    res.json(paginate(transactions, page, limit, total));
  } catch (error) { next(error); }
}

async function createTransaction(req, res, next) {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const {
      payeeId, amount, paymentType, paymentMethodType,
      roomId, contractId, bookingId, invoiceId, description
    } = req.body;

    const transactionId = generateUUID();
    const transactionCode = generateCode('TX', 10);
    const platformFee = Math.round(amount * 0.03); // 3% fee
    const netAmount = amount - platformFee;

    await conn.execute(
      `INSERT INTO transactions 
       (id, transaction_code, payer_id, payee_id, amount, platform_fee, net_amount,
        payment_type, status, payment_method_type, room_id, contract_id, booking_id, invoice_id, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?)`,
      [transactionId, transactionCode, req.user.id, payeeId, amount, platformFee, netAmount,
       paymentType, paymentMethodType || null, roomId || null, contractId || null,
       bookingId || null, invoiceId || null, description || null]
    );

    // Update paid_at
    await conn.execute(
      'UPDATE transactions SET paid_at = NOW() WHERE id = ?', [transactionId]
    );

    // If linked to invoice, mark as paid
    if (invoiceId) {
      await conn.execute(
        `UPDATE invoices SET status = 'paid', paid_amount = paid_amount + ?, paid_at = NOW(), payment_method = ?
         WHERE id = ?`, [amount, paymentMethodType || 'bank_transfer', invoiceId]
      );
    }

    await conn.commit();
    res.status(201).json({ message: 'Thanh toán thành công', data: { id: transactionId, transactionCode } });
  } catch (error) { await conn.rollback(); next(error); } finally { conn.release(); }
}

async function getWallet(req, res, next) {
  try {
    let wallets = await query('SELECT * FROM wallets WHERE user_id = ?', [req.user.id]);
    if (wallets.length === 0) {
      await query('INSERT INTO wallets (id, user_id) VALUES (?, ?)', [generateUUID(), req.user.id]);
      wallets = await query('SELECT * FROM wallets WHERE user_id = ?', [req.user.id]);
    }

    const recentTransactions = await query(
      `SELECT * FROM wallet_transactions WHERE wallet_id = ? ORDER BY created_at DESC LIMIT 20`,
      [wallets[0].id]
    );

    res.json({ data: { ...wallets[0], recentTransactions } });
  } catch (error) { next(error); }
}

async function getPaymentMethods(req, res, next) {
  try {
    const methods = await query(
      'SELECT * FROM payment_methods WHERE user_id = ? AND is_active = 1 ORDER BY is_default DESC',
      [req.user.id]
    );
    res.json({ data: methods });
  } catch (error) { next(error); }
}

async function addPaymentMethod(req, res, next) {
  try {
    const { methodType, bankName, bankAccountNumber, bankAccountHolder, bankBranch, walletPhone, isDefault } = req.body;

    if (isDefault) {
      await query('UPDATE payment_methods SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    }

    const id = generateUUID();
    await query(
      `INSERT INTO payment_methods (id, user_id, method_type, bank_name, bank_account_number, bank_account_holder, bank_branch, wallet_phone, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.user.id, methodType, bankName || null, bankAccountNumber || null,
       bankAccountHolder || null, bankBranch || null, walletPhone || null, isDefault ? 1 : 0]
    );

    res.status(201).json({ message: 'Thêm phương thức thanh toán thành công', data: { id } });
  } catch (error) { next(error); }
}

module.exports = {
  listInvoices, getInvoiceById, createInvoice,
  listTransactions, createTransaction,
  getWallet, getPaymentMethods, addPaymentMethod,
};
