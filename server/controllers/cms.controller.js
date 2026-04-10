// ============================================================
// CMS Controller - Articles, Categories, FAQs
// ============================================================
const { query, getConnection } = require('../config/db');
const { generateUUID, generateSlug, paginate } = require('../utils/helpers');

// ---- Articles ----
async function listArticles(req, res, next) {
  try {
    const { page = 1, limit = 20, categoryId, status = 'published', search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE a.status = ?';
    const params = [status];

    if (categoryId) { whereClause += ' AND a.category_id = ?'; params.push(categoryId); }
    if (search) {
      whereClause += ' AND (a.title LIKE ? OR a.excerpt LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await query(`SELECT COUNT(*) as total FROM articles a ${whereClause}`, params);
    const total = countResult[0]?.total || 0;

    params.push(parseInt(limit), offset);
    const articles = await query(
      `SELECT a.id, a.title, a.slug, a.excerpt, a.cover_image_url, a.published_at, a.view_count,
              u.full_name as author_name, c.name as category_name
       FROM articles a
       LEFT JOIN users u ON a.author_id = u.id
       LEFT JOIN article_categories c ON a.category_id = c.id
       ${whereClause} ORDER BY a.is_pinned DESC, a.published_at DESC LIMIT ? OFFSET ?`, params
    );

    res.json(paginate(articles, page, limit, total));
  } catch (error) { next(error); }
}

async function getArticleBySlug(req, res, next) {
  try {
    const articles = await query(
      `SELECT a.*, u.full_name as author_name, u.avatar_url as author_avatar, c.name as category_name
       FROM articles a 
       LEFT JOIN users u ON a.author_id = u.id
       LEFT JOIN article_categories c ON a.category_id = c.id
       WHERE a.slug = ?`, [req.params.slug]
    );

    if (articles.length === 0) return res.status(404).json({ message: 'Không tìm thấy bài viết' });

    // Increment view
    await query('UPDATE articles SET view_count = view_count + 1 WHERE id = ?', [articles[0].id]);

    res.json({ data: articles[0] });
  } catch (error) { next(error); }
}

async function createArticle(req, res, next) {
  try {
    const { title, excerpt, content, coverImageUrl, categoryId, metaTitle, metaDescription, isFeatured, isPinned, tags } = req.body;
    const id = generateUUID();
    const slug = generateSlug(title);

    await query(
      `INSERT INTO articles (id, title, slug, excerpt, content, cover_image_url, category_id, author_id, meta_title, meta_description, is_featured, is_pinned, status, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', NOW())`,
      [id, title, slug, excerpt || null, content, coverImageUrl || null, categoryId || null, req.user.id, metaTitle || title, metaDescription || excerpt, isFeatured ? 1 : 0, isPinned ? 1 : 0]
    );

    res.status(201).json({ message: 'Tạo bài viết thành công', data: { id, slug } });
  } catch (error) { next(error); }
}

// ---- FAQs ----
async function listFaqs(req, res, next) {
  try {
    const { category } = req.query;
    let sql = 'SELECT * FROM faqs WHERE is_active = 1';
    const params = [];
    if (category) { sql += ' AND category = ?'; params.push(category); }
    sql += ' ORDER BY sort_order ASC, created_at DESC';

    const faqs = await query(sql, params);
    res.json({ data: faqs });
  } catch (error) { next(error); }
}

module.exports = { listArticles, getArticleBySlug, createArticle, listFaqs };
