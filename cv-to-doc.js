// Generates a real .docx (OOXML) from cvData using JSZip, with a .doc fallback.
(function () {
    var JSZIP_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    var DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    function esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function stripTags(html) {
        return String(html || '')
            .replace(/<[^>]+>/g, '')
            .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    }
    function safeFileName() {
        var n = (typeof cvData !== 'undefined' && cvData.name) ? cvData.name : 'CV';
        return n.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }
    function triggerDownload(blob, filename) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
    }
    function loadScript(src, cb) {
        var s = document.createElement('script');
        s.src = src;
        s.onload = function () { cb(null); };
        s.onerror = function () { cb(new Error('load failed')); };
        document.head.appendChild(s);
    }

    /* ---------- DOCX builders ---------- */
    var DARK = '111827', BLUE = '0F4C75', GRAY = '595959';
    var BODY = '21'; // 10.5pt (half-points)

    function run(text, p) {
        p = p || {};
        var rpr = '';
        if (p.font) rpr += '<w:rFonts w:ascii="' + p.font + '" w:hAnsi="' + p.font + '"/>';
        if (p.bold) rpr += '<w:b/>';
        if (p.size) rpr += '<w:sz w:val="' + p.size + '"/><w:szCs w:val="' + p.size + '"/>';
        if (p.color) rpr += '<w:color w:val="' + p.color + '"/>';
        return '<w:r>' + (rpr ? '<w:rPr>' + rpr + '</w:rPr>' : '') +
            '<w:t xml:space="preserve">' + esc(text) + '</w:t></w:r>';
    }
    function para(content, o) {
        o = o || {};
        var pi = '';
        if (o.align) pi += '<w:jc w:val="' + o.align + '"/>';
        if (o.indent) pi += '<w:ind w:left="' + o.indent + '"/>';
        if (o.spaceBefore != null || o.spaceAfter != null || o.line != null) {
            var s = '<w:spacing';
            if (o.spaceBefore != null) s += ' w:before="' + o.spaceBefore + '"';
            if (o.spaceAfter != null) s += ' w:after="' + o.spaceAfter + '"';
            if (o.line != null) s += ' w:line="' + o.line + '" w:lineRule="auto"';
            s += '/>';
            pi += s;
        }
        if (o.border) pi += '<w:pBdr><w:bottom w:val="single" w:sz="' + (o.borderSz || 6) +
            '" w:space="2" w:color="' + (o.borderColor || DARK) + '"/></w:pBdr>';
        var ppr = pi ? '<w:pPr>' + pi + '</w:pPr>' : '';
        return '<w:p>' + ppr + (Array.isArray(content) ? content.join('') : content) + '</w:p>';
    }
    function heading(t) {
        return para(run(t.toUpperCase(), { bold: true, size: '24', color: DARK }),
            { spaceBefore: '280', spaceAfter: '80', border: true, borderColor: DARK });
    }

    function buildBodyParts() {
        var c = cvData.contact || {};
        var parts = [];

        parts.push(para(run(cvData.name, { bold: true, size: '48', color: DARK }), { align: 'center', spaceAfter: '40' }));
        parts.push(para(run(cvData.title, { bold: true, size: '26', color: BLUE }), { align: 'center', spaceAfter: '40' }));

        var cb = [];
        if (c.phone) cb.push(c.phone);
        if (c.email) cb.push(c.email);
        if (c.address) cb.push(c.address);
        if (c.linkedin) cb.push(c.linkedinDisplay || c.linkedin);
        if (c.github) cb.push(c.githubDisplay || c.github);
        parts.push(para(run(cb.join('   |   '), { size: '19', color: GRAY }), { align: 'center', spaceAfter: '80', border: true }));

        parts.push(heading('Professional Summary'));
        parts.push(para(run(cvData.summary, { size: BODY }), { spaceAfter: '60' }));

        parts.push(heading('Technical Skills'));
        (cvData.skills || []).forEach(function (s) {
            parts.push(para([run(s.category + ': ', { bold: true, size: BODY }), run(s.items, { size: BODY })], { spaceAfter: '40' }));
        });

        parts.push(heading('Experience'));
        (cvData.experience || []).forEach(function (e) {
            parts.push(para(run(e.position, { bold: true, size: '24' }), { spaceBefore: '160', spaceAfter: '10' }));
            var meta = (e.company ? e.company : '') + (e.date ? '   |   ' + e.date : '');
            parts.push(para(run(meta, { size: '19', color: GRAY }), { spaceAfter: '40' }));
            if (e.summary) parts.push(para(run(e.summary, { size: BODY }), { spaceAfter: '30' }));
            (e.projects || []).forEach(function (p) {
                var r = [run('•  ', { bold: true, size: BODY })];
                if (p.name) r.push(run(p.name + ': ', { bold: true, size: BODY }));
                r.push(run(p.description, { size: BODY }));
                parts.push(para(r, { indent: '240', spaceAfter: '20' }));
            });
        });

        parts.push(heading('Personal Projects'));
        (cvData.personalProjects || []).forEach(function (p) {
            var head = [run('•  ', { bold: true, size: BODY }), run(p.name, { bold: true, size: BODY })];
            if (p.link) head.push(run('  (' + p.link + ')', { size: '19', color: BLUE }));
            parts.push(para(head, { spaceAfter: '10' }));
            parts.push(para(run(p.description, { size: BODY }), { spaceAfter: '30' }));
        });

        parts.push(heading('Education'));
        (cvData.education || []).forEach(function (e) {
            parts.push(para(run(e.degree, { bold: true, size: BODY }), { spaceBefore: '80', spaceAfter: '10' }));
            var line = e.university || '';
            if (e.cgpa) line += '   |   CGPA: ' + e.cgpa;
            if (e.date) line += '   |   ' + e.date;
            parts.push(para(run(line, { size: '19', color: GRAY }), { spaceAfter: '30' }));
        });

        parts.push(heading('Additional Information'));
        (cvData.additionalInfo || []).forEach(function (a) {
            parts.push(para([run(a.title + ': ', { bold: true, size: BODY }), run(stripTags(a.description), { size: BODY })], { spaceAfter: '30' }));
        });

        return parts.join('');
    }

    function buildDocumentXml() {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
            '<w:body>' + buildBodyParts() +
            '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>' +
            '</w:body></w:document>';
    }

    var CT_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
        '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
        '</Types>';

    var RELS_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
        '</Relationships>';

    var DOC_RELS_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
        '</Relationships>';

    var STYLES_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
        '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults>' +
        '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>' +
        '</w:styles>';

    function downloadDocx() {
        var zip = new JSZip();
        zip.file('[Content_Types].xml', CT_XML);
        zip.folder('_rels').file('.rels', RELS_XML);
        var word = zip.folder('word');
        word.file('document.xml', buildDocumentXml());
        word.file('styles.xml', STYLES_XML);
        word.folder('_rels').file('document.xml.rels', DOC_RELS_XML);
        return zip.generateAsync({ type: 'blob', mimeType: DOCX_MIME, compression: 'DEFLATE' })
            .then(function (blob) {
                triggerDownload(blob, safeFileName() + '-CV.docx');
            });
    }

    /* ---------- .doc fallback (HTML-based) ---------- */
    function section(title) {
        return '<p style="margin:14pt 0 4pt;padding-bottom:2pt;border-bottom:1.5pt solid #111827;font-size:12pt;text-transform:uppercase;letter-spacing:1pt;color:#111827;"><b>' + title + '</b></p>';
    }
    function buildHtmlDoc() {
        var c = cvData.contact || {};
        var cb = [];
        if (c.phone) cb.push(c.phone);
        if (c.email) cb.push(c.email);
        if (c.address) cb.push(c.address);
        if (c.linkedin) cb.push(c.linkedinDisplay || c.linkedin);
        if (c.github) cb.push(c.githubDisplay || c.github);

        var skills = '';
        (cvData.skills || []).forEach(function (s) { skills += '<p style="margin:2pt 0;"><b>' + esc(s.category) + ':</b> ' + esc(s.items) + '</p>'; });
        var exp = '';
        (cvData.experience || []).forEach(function (e) {
            exp += '<p style="margin-top:8pt;margin-bottom:0;"><b style="font-size:12pt;">' + esc(e.position) + '</b></p>';
            exp += '<p style="margin:1pt 0 2pt;color:#444;">' + esc(e.company) + (e.date ? '  |  ' + esc(e.date) : '') + '</p>';
            if (e.summary) exp += '<p style="margin:2pt 0;">' + esc(e.summary) + '</p>';
            (e.projects || []).forEach(function (p) {
                exp += '<p style="margin:4pt 0 0 16pt;"><b>• ' + esc(p.name) + ':</b> ' + esc(p.description) + '</p>';
            });
        });
        var pp = '';
        (cvData.personalProjects || []).forEach(function (p) {
            pp += '<p style="margin:4pt 0 0;"><b>• ' + esc(p.name) + '</b>' + (p.link ? ' (' + esc(p.link) + ')' : '') + '</p>';
            pp += '<p style="margin:2pt 0 0;">' + esc(p.description) + '</p>';
        });
        var edu = '';
        (cvData.education || []).forEach(function (e) {
            edu += '<p style="margin:4pt 0 0;"><b>' + esc(e.degree) + '</b></p>';
            edu += '<p style="margin:1pt 0;">' + esc(e.university) + (e.cgpa ? '  |  CGPA: ' + esc(e.cgpa) : '') + (e.date ? '  |  ' + esc(e.date) : '') + '</p>';
        });
        var add = '';
        (cvData.additionalInfo || []).forEach(function (a) {
            add += '<p style="margin:4pt 0 0;"><b>' + esc(a.title) + ':</b> ' + esc(stripTags(a.description)) + '</p>';
        });

        return '' +
            '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
            '<head><meta charset="utf-8"><title>' + esc(cvData.name) + ' - CV</title>' +
            '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->' +
            '<style>@page{size:A4;margin:1in;}body{font-family:Calibri,Arial,sans-serif;font-size:10.5pt;color:#1a1a1a;line-height:1.4;}</style></head><body>' +
            '<p style="text-align:center;margin:0;font-size:24pt;font-weight:bold;color:#111827;">' + esc(cvData.name) + '</p>' +
            '<p style="text-align:center;margin:2pt 0 4pt;font-size:13pt;color:#0f4c75;font-weight:bold;">' + esc(cvData.title) + '</p>' +
            '<p style="text-align:center;margin:0 0 4pt;font-size:9.5pt;color:#444;">' + esc(cb.join('  |  ')) + '</p>' +
            '<p style="border-bottom:1.5pt solid #111827;margin:0 0 6pt;font-size:1pt;">&nbsp;</p>' +
            section('Professional Summary') + '<p style="margin:2pt 0;">' + esc(cvData.summary) + '</p>' +
            section('Technical Skills') + skills +
            section('Experience') + exp +
            section('Personal Projects') + pp +
            section('Education') + edu +
            section('Additional Information') + add +
            '</body></html>';
    }
    function downloadDocFallback() {
        var blob = new Blob(['\ufeff', buildHtmlDoc()], { type: 'application/msword' });
        triggerDownload(blob, safeFileName() + '-CV.doc');
    }

    /* ---------- entry ---------- */
    function downloadCvDoc() {
        if (typeof cvData === 'undefined') { alert('CV data not loaded yet.'); return; }
        if (window.JSZip) {
            downloadDocx().catch(function () { downloadDocFallback(); });
            return;
        }
        loadScript(JSZIP_URL, function (err) {
            if (err || !window.JSZip) { downloadDocFallback(); return; }
            downloadDocx().catch(function () { downloadDocFallback(); });
        });
    }

    window.downloadCvDoc = downloadCvDoc;

    function init() {
        var btn = document.getElementById('cv-download-btn');
        if (btn) btn.addEventListener('click', downloadCvDoc);
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
