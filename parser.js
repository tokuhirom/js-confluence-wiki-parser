var assert = require("assert");

const cases = [
    [`
foo
`, `
foo
`],
    [`b'`, `b&#x27;`],
    [`h1. foo`, `<h1>foo</h1>`],
    [`!http://www.host.com/image.gif!`, `<img src="http://www.host.com/image.gif">`],
    [`http://mixi.jp`, `<a href="http://mixi.jp">http://mixi.jp</a>`],
    [`- foo
 - bar`, "&nbsp;&#x25CF; foo\n&nbsp;&nbsp;&#x25CB; bar"],
];

function escape_html (string) {
    if(typeof string !== 'string') {
        return string;
    }
    return string.replace(/[&'`"<>]/g, function(char) {
        return {
            '&': '&amp;',
            "'": '&#x27;',
            '`': '&#x60;',
            '"': '&quot;',
            '<': '&lt;',
            '>': '&gt;',
        }[char];
    });
}

function inline_markup(string) {
    if(typeof string !== 'string') {
        return string;
    }
    return string.replace(/([&'`"<>])|!(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b(?:[-a-zA-Z0-9@:%_\+.~#?&//=]*))!|(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b(?:[-a-zA-Z0-9@:%_\+.~#?&//=]*))/g, function(match, char, img, url) {
        if (char) {
            return {
                '&': '&amp;',
                "'": '&#x27;',
                '`': '&#x60;',
                '"': '&quot;',
                '<': '&lt;',
                '>': '&gt;',
            }[char];
        } else if (img) {
            return `<img src="${escape_html(img)}">`;
        } else if (url) {
            return `<a href="${escape_html(url)}">${escape_html(url)}</a>`;
        } else {
            return match; // should not reach here
        }
    });
}

class RootNode {
    constructor(lines) {
        this.lines = lines;
    }

    as_html() {
        return this.lines.map(x => x.as_html()).join("\n");
    }
}

class LineNode {
    constructor(txt) {
        this.txt = txt;
    }

    as_html() {
        return inline_markup(this.txt);
    }
}

class HeaderNode {
    constructor(label, level) {
        this.label = label;
        this.level = level;
    }

    as_html() {
        return "<h" + this.level + ">" + escape_html(this.label) + "</h" + this.level + ">";
    }
}

class ItemNode {
    constructor(label, level) {
        this.label = label;
        this.level = level;
    }

    as_html() {
        const icon = [
            '&#x25A0;',
            '&#x25CF;',
            '&#x25CB;',
            '&#x2605;',
        ][this.level] || '&#x25A0;';
        return '&nbsp;'.repeat(this.level) + icon + ' ' + this.label;
    }
}

class Parser {
    constructor() {
    }

    parse(src) {
        const lines = src.split(/\n/);
        const result = [];
        for (var i=0, l=lines.length; i<l; i++) {
            const line = lines[i];
            {
                const m = line.match(/^h([1-5])\.\s+(.*)$/);
                if (m) {
                    const level = m[1];
                    const label = m[2];
                    result.push(new HeaderNode(label, level));
                    continue
                }
            }
            {
                const m = line.match(/^(\s*[-*#]+)\s*(.*)/);
                if (m) {
                    const level = m[1].length;
                    const label = m[2];
                    result.push(new ItemNode(label, level));
                    continue
                }
            }

            result.push(new LineNode(line));
        }
        return new RootNode(result);
    }
}

const parser = new Parser()
cases.forEach(function (row) {
    const src = row[0];
    console.log(`==> ${src.replace(/\n/g, '\\n')} <==`);
    const ast = parser.parse(src);
    assert.equal(row[1], ast.as_html());
});
