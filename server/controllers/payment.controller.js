// ============================================================
// Invoice & Payment Controller (v2.0 schema)
// ============================================================
const { query, getConnection } = require('../config/db');
const { generateUUID } = require('../utils/helpers');

/**
 * POST /invoices - Create invoice (landlord)
 */
async function createInvoice(req, res, next) {
  try {
    const { contractId, periodMonth, baseRent, electricUsage = 0, waterUsage = 0,
            electricFee = 0, waterFee = 0, otherFees = 0, dueDate, utilityReadingId } = req.body;

    if (!contractId || !periodMonth || !baseRent || !dueDate) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    const total = parseFloat(baseRent) + parseFloat(electricFee) + parseFloat(waterFee) + parseFloat(otherFees);
    const invoiceId = generateUUID();

    await query(
      `INSERT INTO invoices (id, contract_id, utility_reading_id, period_month, base_rent,
       electric_usage, water_usage, electric_fee, water_fee, other_fees, total, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [invoiceId, contractId, utilityReadingId || null, periodMonth, baseRent,
       electricUsage, waterUsage, electricFee, waterFee, otherFees, total, dueDate]
    );

    // Notify tenant
    const contracts = await query('SELECT tenant_id FROM contracts WHERE id = ?', [contractId]);
    if (contracts.length > 0) {
      await query(
        `INSERT INTO notifications (id, user_id, type, title, body, ref_id)
         VALUES (?, ?, 'invoice_due', 'Hóa đơn mới', 'Bạn có hóa đơn mới cần thanh toán', ?)`,
        [generateUUID(), contracts[0].tenant_id, invoiceId]
      );
    }

    res.status(201).json({ message: 'Tạo hóa đơn thành công', data: { id: invoiceId } });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /invoices - List invoices
 */
async function listInvoices(req, res, next) {
  try {
    const { page = 1, limit = 20, status, contractId } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let conditions = [];
    const params = [];

    if (req.user.role === 'tenant') {
      conditions.push('c.tenant_id = ?');
      params.push(req.user.id);
    } else if (req.user.role === 'landlord') {
      conditions.push('c.landlord_id = ?');
      params.push(req.user.id);
    }

    if (status) { conditions.push('i.status = ?'); params.push(status); }
    if (contractId) { conditions.push('i.contract_id = ?'); params.push(contractId); }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await query(
      `SELECT COUNT(*) as total FROM invoices i JOIN contracts c ON i.contract_id = c.id ${whereClause}`,
      [...params]
    );
    const total = countResult[0]?.total || 0;

    params.push(parseInt(limit), offset);
    const invoices = await query(
      `SELECT i.*, c.room_id, r.title as room_title, r.address as room_address,
              t.full_name as tenant_name, l.full_name as landlord_name
       FROM invoices i
       JOIN contracts c ON i.contract_id = c.id
       JOIN rooms r ON c.room_id = r.id
       JOIN users t ON c.tenant_id = t.id
       JOIN users l ON c.landlord_id = l.id
       ${whereClause}
       ORDER BY i.created_at DESC LIMIT ? OFFSET ?`, params
    );

    res.json({
      data: invoices,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /invoices/:id
 */
async function getInvoiceById(req, res, next) {
  try {
    const invoices = await query(
      `SELECT i.*, c.room_id, c.tenant_id, c.landlord_id,
              r.title as room_title, r.address as room_address,
              t.full_name as tenant_name, t.phone as tenant_phone,
              l.full_name as landlord_name, l.phone as landlord_phone
       FROM invoices i
       JOIN contracts c ON i.contract_id = c.id
       JOIN rooms r ON c.room_id = r.id
       JOIN users t ON c.tenant_id = t.id
       JOIN users l ON c.landlord_id = l.id
       WHERE i.id = ?`, [req.params.id]
    );
    if (invoices.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
    }
    res.json({ data: invoices[0] });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /payments - Make payment
 */
async function createPayment(req, res, next) {
  try {
    const { invoiceId, amount, method } = req.body;

    if (!invoiceId || !amount || !method) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    const paymentId = generateUUID();
    const transactionId = 'TXN-' + Date.now().toString(36).toUpperCase();

    await query(
      `INSERT INTO payments (id, invoice_id, tenant_id, amount, method, transaction_id, status)
       VALUES (?, ?, ?, ?, ?, ?, 'success')`,
      [paymentId, invoiceId, req.user.id, amount, method, transactionId]
    );

    // Update invoice status
    await query("UPDATE invoices SET status = 'paid', paid_at = NOW() WHERE id = ?", [invoiceId]);

    res.status(201).json({ message: 'Thanh toán thành công', data: { id: paymentId, transactionId } });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /payments - List payments
 */
async function listPayments(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = 'WHERE p.tenant_id = ?';
    const params = [req.user.id];

    if (req.user.role === 'landlord') {
      whereClause = 'WHERE c.landlord_id = ?';
    }

    const countResult = await query(
      `SELECT COUNT(*) as total FROM payments p
       JOIN invoices i ON p.invoice_id = i.id
       JOIN contracts c ON i.contract_id = c.id ${whereClause}`, [...params]
    );
    const total = countResult[0]?.total || 0;

    params.push(parseInt(limit), offset);
    const payments = await query(
      `SELECT p.*, i.period_month, i.total as invoice_total,
              r.title as room_title
       FROM payments p
       JOIN invoices i ON p.invoice_id = i.id
       JOIN contracts c ON i.contract_id = c.id
       JOIN rooms r ON c.room_id = r.id
       ${whereClause}
       ORDER BY p.paid_at DESC LIMIT ? OFFSET ?`, params
    );

    res.json({
      data: payments,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================
// Utility Readings
// ============================================================

/**
 * POST /utility-readings - Record reading (landlord)
 */
async function createUtilityReading(req, res, next) {
  try {
    const { contractId, periodMonth, electricPrev, electricCurr, waterPrev, waterCurr, readingImages } = req.body;

    if (!contractId || !periodMonth) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    const readingId = generateUUID();
    await query(
      `INSERT INTO utility_readings (id, contract_id, period_month, electric_prev, electric_curr, water_prev, water_curr, reading_images, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [readingId, contractId, periodMonth, electricPrev || 0, electricCurr || 0,
       waterPrev || 0, waterCurr || 0, readingImages ? JSON.stringify(readingImages) : null, req.user.id]
    );

    res.status(201).json({ message: 'Ghi chỉ số thành công', data: { id: readingId } });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /utility-readings?contractId=xxx
 */
async function listUtilityReadings(req, res, next) {
  try {
    const { contractId } = req.query;
    if (!contractId) {
      return res.status(400).json({ message: 'Thiếu contractId' });
    }

    const readings = await query(
      `SELECT ur.*, u.full_name as recorded_by_name
       FROM utility_readings ur
       JOIN users u ON ur.recorded_by = u.id
       WHERE ur.contract_id = ?
       ORDER BY ur.period_month DESC`,
      [contractId]
    );

    res.json({ data: readings });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createInvoice,
  listInvoices,
  getInvoiceById,
  createPayment,
  listPayments,
  createUtilityReading,
  listUtilityReadings,
};
