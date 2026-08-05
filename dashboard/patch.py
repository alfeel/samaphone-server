import os

filepath = r"D:\sama-phone\sama-phone\artifacts\mobile\web-local\admin.html"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add state variable
if 'financeDateFilter: "all",' not in content:
    content = content.replace(
        '      var state = {\n',
        '      var state = {\n        financeDateFilter: "all",\n'
    )

# 2. Add filter helper function
filter_fn = """
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
"""
if "function applyFinanceDateFilter(orders)" not in content:
    content = content.replace('        function getFinanceSummary() {', filter_fn + '        function getFinanceSummary() {')

# 3. Apply the filter to orders
content = content.replace(
    '        function getFinanceSummary() {\n          var orders = state.orders.filter(function (order) {',
    '        function getFinanceSummary() {\n          var orders = applyFinanceDateFilter(state.orders).filter(function (order) {'
)

content = content.replace(
    '            var orders = state.orders.filter(function (order) {\n              return order.assignedSupplierId === supplier.id;\n            });',
    '            var orders = applyFinanceDateFilter(state.orders).filter(function (order) {\n              return order.assignedSupplierId === supplier.id;\n            });'
)

content = content.replace(
    '          var items = state.orders.filter(function (order) {\n            if (!order.assignedSupplierId) return false;',
    '          var items = applyFinanceDateFilter(state.orders).filter(function (order) {\n            if (!order.assignedSupplierId) return false;'
)


# 4. Add UI Controls for Filter and Print to renderFinanceEditor
ui_html = """
            '<div class="inline-tools" style="margin-top:14px; margin-bottom:14px; gap: 8px;">',
            '<button class="btn ' + (state.financeDateFilter === 'all' ? 'btn--primary' : 'btn--ghost') + '" onclick="state.financeDateFilter=\\'all\\'; renderFinanceEditor();">الكل</button>',
            '<button class="btn ' + (state.financeDateFilter === 'month' ? 'btn--primary' : 'btn--ghost') + '" onclick="state.financeDateFilter=\\'month\\'; renderFinanceEditor();">هذا الشهر</button>',
            '<button class="btn ' + (state.financeDateFilter === 'week' ? 'btn--primary' : 'btn--ghost') + '" onclick="state.financeDateFilter=\\'week\\'; renderFinanceEditor();">هذا الأسبوع</button>',
            '<button class="btn ' + (state.financeDateFilter === 'today' ? 'btn--primary' : 'btn--ghost') + '" onclick="state.financeDateFilter=\\'today\\'; renderFinanceEditor();">اليوم</button>',
            '<button class="btn btn--danger" onclick="window.print()" style="margin-right: auto;">طباعة تقرير PDF</button>',
            '</div>',
"""
if "طباعة تقرير PDF" not in content.split("function renderFinanceEditor() {")[1].split("function")[0]:
    content = content.replace(
        """              : '<span class="badge badge--warning">ليس مصرح</span>',
            '</div>',
            '<div class="inline-tools" style="margin-top:14px;">',""",
        """              : '<span class="badge badge--warning">ليس مصرح</span>',
            '</div>',""" + ui_html + """            '<div class="inline-tools" style="margin-top:14px;">',"""
    )


# 5. Add Print PDF to Stats (Reports)
if "طباعة تقرير PDF" not in content.split("function renderStats() {")[1].split("function")[0]:
    content = content.replace(
        """        function renderStats() {
          if (!refs.statsEditor) return;

          refs.statsEditor.innerHTML = [
            '<div class="section-head">',
            '<div>',
            '<h3>الإحصائيات</h3>',
            '<p class="muted">نظرة عامة على أداء التطبيق.</p>',
            '</div>',
            '</div>',""",
        """        function renderStats() {
          if (!refs.statsEditor) return;

          refs.statsEditor.innerHTML = [
            '<div class="section-head">',
            '<div>',
            '<h3>الإحصائيات</h3>',
            '<p class="muted">نظرة عامة على أداء التطبيق.</p>',
            '</div>',
            '<button class="btn btn--danger" onclick="window.print()" style="margin-top:8px;">طباعة تقرير PDF</button>',
            '</div>',"""
    )

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("done")
