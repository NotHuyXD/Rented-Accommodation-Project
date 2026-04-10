// ============================================================
// Contract Controller - CRUD, Sign, Terminate, Renew
// ============================================================
const { query, getConnection } = require('../config/db');
const { generateUUID, generateCode, paginate } = require('../utils/helpers');

async function listContracts(req, res, next) {
  try {
    const { page = 1, limit = 20, status, role } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (req.user.role === 'landlord' || role === 'landlord') {
      whereClause += ' AND c.landlord_id = ?'; params.push(req.user.id);
    } else if (req.user.role !== 'admin') {
      whereClause += ' AND c.tenant_id = ?'; params.push(req.user.id);
    }
    if (status) { whereClause += ' AND c.status = ?'; params.push(status); }

    const countResult = await query(`SELECT COUNT(*) as total FROM contracts c ${whereClause}`, [...params]);
    const total = countResult[0]?.total || 0;

    params.push(parseInt(limit), offset);
    const contracts = await query(
      `SELECT c.id, c.contract_number, c.status, c.start_date, c.end_date,
              c.monthly_rent, c.deposit_amount, c.payment_due_day,
              c.tenant_signed, c.landlord_signed, c.created_at,
              r.title as room_title, r.address as room_address,
              t.full_name as tenant_name, l.full_name as landlord_name,
              (SELECT url FROM room_images ri WHERE ri.room_id = r.id AND ri.is_cover = 1 LIMIT 1) as room_image
       FROM contracts c
       JOIN rooms r ON c.room_id = r.id
       JOIN users t ON c.tenant_id = t.id
       JOIN users l ON c.landlord_id = l.id
       ${whereClause} ORDER BY c.created_at DESC LIMIT ? OFFSET ?`, params
    );

    res.json(paginate(contracts, page, limit, total));
  } catch (error) { next(error); }
}

async function getContractById(req, res, next) {
  try {
    const contracts = await query(
      `SELECT c.*,
              r.title as room_title, r.address as room_address, r.slug as room_slug,
              t.full_name as tenant_name, t.phone as tenant_phone, t.email as tenant_email,
              l.full_name as landlord_name, l.phone as landlord_phone, l.email as landlord_email
       FROM contracts c
       JOIN rooms r ON c.room_id = r.id
       JOIN users t ON c.tenant_id = t.id
       JOIN users l ON c.landlord_id = l.id
       WHERE c.id = ?`, [req.params.id]
    );

    if (contracts.length === 0) return res.status(404).json({ message: 'Không tìm thấy hợp đồng' });

    const contract = contracts[0];
    if (contract.tenant_id !== req.user.id && contract.landlord_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền xem hợp đồng này' });
    }

    const clauses = await query(
      'SELECT * FROM contract_clauses WHERE contract_id = ? ORDER BY sort_order', [req.params.id]
    );
    const attachments = await query(
      'SELECT * FROM contract_attachments WHERE contract_id = ?', [req.params.id]
    );
    const history = await query(
      `SELECT ch.*, u.full_name as changed_by_name FROM contract_history ch
       LEFT JOIN users u ON ch.changed_by = u.id WHERE ch.contract_id = ? ORDER BY ch.created_at`, [req.params.id]
    );

    res.json({ data: { ...contract, clauses, attachments, history } });
  } catch (error) { next(error); }
}

async function createContract(req, res, next) {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const {
      roomId, tenantId, bookingId, templateId,
      startDate, endDate, monthlyRent, depositAmount, paymentDueDay = 5,
      electricityPrice, waterPrice, internetPrice, parkingPrice, serviceFee,
      content, rules, additionalTerms, clauses = []
    } = req.body;

    const contractId = generateUUID();
    const contractNumber = generateCode('CT', 8);

    await conn.execute(
      `INSERT INTO contracts 
       (id, contract_number, template_id, booking_id, tenant_id, landlord_id, room_id,
        status, content, start_date, end_date, monthly_rent, deposit_amount, payment_due_day,
        electricity_price, water_price, internet_price, parking_price, service_fee,
        rules, additional_terms)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [contractId, contractNumber, templateId || null, bookingId || null,
       tenantId, req.user.id, roomId,
       content || 'Hợp đồng thuê phòng trọ', startDate, endDate, monthlyRent, depositAmount,
       paymentDueDay, electricityPrice || null, waterPrice || null,
       internetPrice || null, parkingPrice || null, serviceFee || null,
       rules || null, additionalTerms || null]
    );

    // Insert clauses
    for (let i = 0; i < clauses.length; i++) {
      const clause = clauses[i];
      await conn.execute(
        `INSERT INTO contract_clauses (id, contract_id, clause_number, title, content, is_required, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [generateUUID(), contractId, i + 1, clause.title, clause.content, clause.isRequired ? 1 : 0, i]
      );
    }

    // History
    await conn.execute(
      `INSERT INTO contract_history (id, contract_id, action, changed_by, note)
       VALUES (?, ?, 'created', ?, 'Contract created')`,
      [generateUUID(), contractId, req.user.id]
    );

    await conn.commit();
    res.status(201).json({ message: 'Tạo hợp đồng thành công', data: { id: contractId, contractNumber } });
  } catch (error) { await conn.rollback(); next(error); } finally { conn.release(); }
}

async function signContract(req, res, next) {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const { signatureData } = req.body;
    const [contracts] = await conn.execute('SELECT * FROM contracts WHERE id = ?', [req.params.id]);
    if (contracts.length === 0) return res.status(404).json({ message: 'Không tìm thấy hợp đồng' });

    const contract = contracts[0];
    const isTenant = contract.tenant_id === req.user.id;
    const isLandlord = contract.landlord_id === req.user.id;

    if (!isTenant && !isLandlord) return res.status(403).json({ message: 'Không có quyền ký hợp đồng này' });

    if (isTenant) {
      await conn.execute(
        `UPDATE contracts SET tenant_signed = 1, tenant_signed_at = NOW(), 
         tenant_signature_data = ?, tenant_signed_ip = ? WHERE id = ?`,
        [signatureData || null, req.ip, req.params.id]
      );
    } else {
      await conn.execute(
        `UPDATE contracts SET landlord_signed = 1, landlord_signed_at = NOW(),
         landlord_signature_data = ?, landlord_signed_ip = ? WHERE id = ?`,
        [signatureData || null, req.ip, req.params.id]
      );
    }

    // Check if both signed → activate
    const [updated] = await conn.execute('SELECT tenant_signed, landlord_signed FROM contracts WHERE id = ?', [req.params.id]);
    if (updated[0].tenant_signed && updated[0].landlord_signed) {
      await conn.execute(
        `UPDATE contracts SET status = 'active', activated_at = NOW() WHERE id = ?`, [req.params.id]
      );
      // Update room status to rented
      await conn.execute(`UPDATE rooms SET status = 'rented' WHERE id = ?`, [contract.room_id]);
    } else {
      await conn.execute(
        `UPDATE contracts SET status = 'pending_signature' WHERE id = ?`, [req.params.id]
      );
    }

    await conn.execute(
      `INSERT INTO contract_history (id, contract_id, action, changed_by, note)
       VALUES (?, ?, 'signed', ?, ?)`,
      [generateUUID(), req.params.id, req.user.id, `Signed by ${isTenant ? 'tenant' : 'landlord'}`]
    );

    await conn.commit();
    res.json({ message: 'Ký hợp đồng thành công' });
  } catch (error) { await conn.rollback(); next(error); } finally { conn.release(); }
}

async function terminateContract(req, res, next) {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const { terminationType, terminationDate, reason, penaltyAmount = 0, depositRefundAmount = 0 } = req.body;

    await conn.execute(
      `INSERT INTO contract_terminations (id, contract_id, termination_type, requested_by, termination_date, reason, penalty_amount, deposit_refund_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [generateUUID(), req.params.id, terminationType, req.user.id, terminationDate, reason, penaltyAmount, depositRefundAmount]
    );

    await conn.execute(
      `UPDATE contracts SET status = 'terminated', terminated_at = NOW() WHERE id = ?`, [req.params.id]
    );

    // Free up the room
    const [contracts] = await conn.execute('SELECT room_id FROM contracts WHERE id = ?', [req.params.id]);
    if (contracts.length > 0) {
      await conn.execute(`UPDATE rooms SET status = 'active' WHERE id = ?`, [contracts[0].room_id]);
    }

    await conn.commit();
    res.json({ message: 'Chấm dứt hợp đồng thành công' });
  } catch (error) { await conn.rollback(); next(error); } finally { conn.release(); }
}

module.exports = { listContracts, getContractById, createContract, signContract, terminateContract };
