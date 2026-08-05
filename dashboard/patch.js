const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, 'admin.html');
let content = fs.readFileSync(filepath, 'utf8');

// 1. Add state variable
if (!content.includes('financeDateFilter: "all"')) {
    content = content.replace(
        '      var state = {\n',
        '      var state = {\n        financeDateFilter: "all",\n'
    );
}

// 2. Add filter helper function
const filter_fn = `
        function applyFinanceDateFilter(orders) {
          if (state.financeDateFilter === "all") return orders;
          var now = new Date();
          var startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          var cutoff = 0;
          if (state.financeDateFilter === "today") {
            cutoff = startOfDay;
          } else if (state.financeDateFilter === "week") {
            cutoff = startOfDay - (6 * 24 * 60 * 60 * 1000);
          } else if (state.financeDateFilter === "month") {
            cutoff = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
          }
          return orders.filter(function(o) { return o.createdAt >= cutoff; });
        }
`;
if (!content.includes('function applyFinanceDateFilter(orders)')) {
    content = content.replace('        function getFinanceSummary() {', filter_fn + '        function getFinanceSummary() {');
}

// 3. Apply the filter to orders
content = content.replace(
    '        function getFinanceSummary() {\n          var orders = state.orders.filter(function (order) {',
    '        function getFinanceSummary() {\n          var orders = applyFinanceDateFilter(state.orders).filter(function (order) {'
);

content = content.replace(
    '            var orders = state.orders.filter(function (order) {\n              return order.assignedSupplierId === supplier.id;\n            });',
    '            var orders = applyFinanceDateFilter(state.orders).filter(function (order) {\n              return order.assignedSupplierId === supplier.id;\n            });'
);

content = content.replace(
    '          var items = state.orders.filter(function (order) {\n            if (!order.assignedSupplierId) return false;',
    '          var items = applyFinanceDateFilter(state.orders).filter(function (order) {\n            if (!order.assignedSupplierId) return false;'
);

// 4. Add UI Controls for Filter and Print to renderFinanceEditor
const ui_html = `
            '<div class="inline-tools" style="margin-top:14px; margin-bottom:14px; gap: 8px; display:flex; flex-wrap:wrap;">',
            '<button class="btn ' + (state.financeDateFilter === 'all' ? 'btn--primary' : 'btn--ghost') + '" onclick="state.financeDateFilter=\\'all\\'; renderFinanceEditor();">الكل</button>',
            '<button class="btn ' + (state.financeDateFilter === 'month' ? 'btn--primary' : 'btn--ghost') + '" onclick="state.financeDateFilter=\\'month\\'; renderFinanceEditor();">هذا الشهر</button>',
            '<button class="btn ' + (state.financeDateFilter === 'week' ? 'btn--primary' : 'btn--ghost') + '" onclick="state.financeDateFilter=\\'week\\'; renderFinanceEditor();">هذا الأسبوع</button>',
            '<button class="btn ' + (state.financeDateFilter === 'today' ? 'btn--primary' : 'btn--ghost') + '" onclick="state.financeDateFilter=\\'today\\'; renderFinanceEditor();">اليوم</button>',
            '<button class="btn btn--danger" onclick="window.print()" style="margin-right: auto;">طباعة تقرير PDF</button>',
            '</div>',
`;

if (!content.includes('طباعة تقرير PDF')) {
    content = content.replace(
        `              : '<span class="badge badge--warning">ليس مصرح</span>',
            '</div>',
            '<div class="inline-tools" style="margin-top:14px;">',`,
        `              : '<span class="badge badge--warning">ليس مصرح</span>',
            '</div>',` + ui_html + `            '<div class="inline-tools" style="margin-top:14px;">',`
    );
}

// 5. Add Print PDF to Stats (Reports)
if (content.split("function renderStats() {")[1] && !content.split("function renderStats() {")[1].split("function")[0].includes("طباعة تقرير PDF")) {
    content = content.replace(
        `        function renderStats() {
          if (!refs.statsEditor) return;

          refs.statsEditor.innerHTML = [
            '<div class="section-head">',
            '<div>',
            '<h3>الإحصائيات</h3>',
            '<p class="muted">نظرة عامة على أداء التطبيق.</p>',
            '</div>',
            '</div>',`,
        `        function renderStats() {
          if (!refs.statsEditor) return;

          refs.statsEditor.innerHTML = [
            '<div class="section-head" style="align-items:flex-start;">',
            '<div>',
            '<h3>الإحصائيات</h3>',
            '<p class="muted">نظرة عامة على أداء التطبيق.</p>',
            '</div>',
            '<button class="btn btn--danger" onclick="window.print()">طباعة تقرير PDF</button>',
            '</div>',`
    );
}

fs.writeFileSync(filepath, content, 'utf8');
console.log("Admin.html patched successfully");
