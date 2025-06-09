let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let budgets = JSON.parse(localStorage.getItem("budgets")) || {};
let currentType = "expense";
let editingTransactionId = null;

document.addEventListener("DOMContentLoaded", function () {
    initializeApp();
});

function initializeApp() {
    document.getElementById("date").value = new Date()
        .toISOString()
        .split("T")[0];

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark");
        document.querySelector(".theme-toggle").textContent = "☀️";
    }

    updateDisplay();
}
function saveTransactions() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

function saveBudgets() {
    localStorage.setItem("budgets", JSON.stringify(budgets));
}
function toggleTheme() {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    document.querySelector(".theme-toggle").textContent = isDark
        ? "☀️"
        : "🌙";
    localStorage.setItem("theme", isDark ? "dark" : "light");
}
function toggleForm() {
    const form = document.getElementById("expenseForm");
    form.classList.toggle("active");
    if (!form.classList.contains("active")) {
        cancelEdit();
    }
}

function setType(type) {
    currentType = type;
    document.querySelectorAll(".type-btn").forEach((btn) => {
        btn.classList.remove("active");
    });
    document.querySelector(`[data-type="${type}"]`).classList.add("active");
}

function editTransaction(id) {
    const transaction = transactions.find((t) => t.id === id);
    if (!transaction) return;

    editingTransactionId = id;
    document.getElementById("amount").value = transaction.amount;
    document.getElementById("description").value = transaction.description;
    document.getElementById("category").value = transaction.category;
    document.getElementById("date").value = transaction.date;

    setType(transaction.type);
    const form = document.getElementById("expenseForm");
    if (!form.classList.contains("active")) {
        form.classList.add("active");
    }
    document.getElementById("addBtnText").textContent =
        "Update Transaction";
    document.getElementById("submitBtn").classList.add("editing");
    document.getElementById("cancelBtn").style.display = "block";

    showNotification(
        "Editing transaction - make your changes and click Update",
        "info"
    );
}

function cancelEdit() {
    editingTransactionId = null;
    clearForm();
    document.getElementById("addBtnText").textContent = "Add Transaction";
    document.getElementById("submitBtn").classList.remove("editing");
    document.getElementById("cancelBtn").style.display = "none";
}

function addOrUpdateTransaction() {
    const amount = parseFloat(document.getElementById("amount").value);
    const description = document.getElementById("description").value.trim();
    const category = document.getElementById("category").value;
    const date = document.getElementById("date").value;

    if (!amount || !description || !category || !date) {
        showNotification("Please fill in all fields", "error");
        return;
    }

    if (amount <= 0) {
        showNotification("Amount must be greater than 0", "error");
        return;
    }

    if (editingTransactionId) {
        const transactionIndex = transactions.findIndex(
            (t) => t.id === editingTransactionId
        );
        if (transactionIndex !== -1) {
            transactions[transactionIndex] = {
                ...transactions[transactionIndex],
                amount: amount,
                description: description,
                category: category,
                type: currentType,
                date: date,
                timestamp: new Date().toISOString(),
            };

            showNotification("Transaction updated successfully!", "success");
        }
    } else {
        const transaction = {
            id: Date.now().toString(),
            amount: amount,
            description: description,
            category: category,
            type: currentType,
            date: date,
            timestamp: new Date().toISOString(),
        };

        transactions.unshift(transaction);
        showNotification(
            `${currentType === "income" ? "Income" : "Expense"
            } added successfully!`,
            "success"
        );
    }
    const btn = document.getElementById("submitBtn");
    const originalText = btn.innerHTML;
    btn.innerHTML = editingTransactionId ? "✅ Updated!" : "✅ Added!";
    btn.style.background = "var(--gradient-success)";

    saveTransactions();
    updateDisplay();
    clearForm();
    toggleForm();
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = editingTransactionId
            ? "var(--gradient-secondary)"
            : "var(--gradient-success)";
    }, 2000);
}

function deleteTransaction(id) {
    if (confirm("Are you sure you want to delete this transaction?")) {
        transactions = transactions.filter((t) => t.id !== id);
        saveTransactions();
        updateDisplay();
        showNotification("Transaction deleted successfully!", "success");
    }
}

function clearForm() {
    document.getElementById("amount").value = "";
    document.getElementById("description").value = "";
    document.getElementById("category").value = "";
    document.getElementById("date").value = new Date()
        .toISOString()
        .split("T")[0];
}
function openBudgetModal() {
    document.getElementById("budgetModal").classList.add("active");
    if (budgets.overall) {
        document.getElementById("budgetAmount").value = budgets.overall;
    }
}

function closeBudgetModal() {
    document.getElementById("budgetModal").classList.remove("active");
}

function setBudget() {
    const amount = parseFloat(
        document.getElementById("budgetAmount").value
    );
    const category =
        document.getElementById("budgetCategory").value || "overall";

    if (!amount || amount <= 0) {
        showNotification("Please enter a valid budget amount", "error");
        return;
    }

    budgets[category] = amount;
    saveBudgets();
    updateDisplay();
    closeBudgetModal();
    showNotification("Budget set successfully!", "success");
}

function updateDisplay() {
    updateSummary();
    updateBudgetDisplay();
    renderTransactions();
    updateCharts();
}

function updateSummary() {
    const totalIncome = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpenses;

    document.getElementById(
        "totalIncome"
    ).textContent = `₹${totalIncome.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
    })}`;
    document.getElementById(
        "totalExpenses"
    ).textContent = `₹${totalExpenses.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
    })}`;

    const balanceElement = document.getElementById("balance");
    balanceElement.textContent = `₹${balance.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
    })}`;
    balanceElement.style.color =
        balance >= 0 ? "var(--success)" : "var(--danger)";
}

function updateBudgetDisplay() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyExpenses = transactions
        .filter((t) => {
            const tDate = new Date(t.date);
            return (
                t.type === "expense" &&
                tDate.getMonth() === currentMonth &&
                tDate.getFullYear() === currentYear
            );
        })
        .reduce((sum, t) => sum + t.amount, 0);

    const budget = budgets.overall || 0;
    const budgetUsed = budget > 0 ? (monthlyExpenses / budget) * 100 : 0;
    const remaining = budget - monthlyExpenses;

    document.getElementById(
        "budgetStatus"
    ).textContent = `₹${remaining.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
    })}`;

    const progressFill = document.getElementById("budgetProgress");
    const progressText = document.getElementById("budgetText");

    if (budget > 0) {
        progressFill.style.width = `${Math.min(budgetUsed, 100)}%`;
        progressFill.className = `progress-fill ${budgetUsed > 90 ? "warning" : ""
            }`;
        progressText.textContent = `${budgetUsed.toFixed(
            1
        )}% used (${monthlyExpenses.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
        })} of ${budget.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
        })})`;
    } else {
        progressFill.style.width = "0%";
        progressText.textContent = "Set a budget to track spending";
    }
}

function renderTransactions() {
    const container = document.getElementById("transactionsList");

    if (transactions.length === 0) {
        container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">💳</div>
                        <p><strong>No transactions found!</strong></p>
                        <p>Add some transactions to get started.</p>
                    </div>
                `;
        return;
    }

    container.innerHTML = transactions
        .map(
            (transaction) => `
                    <div class="transaction-item ${transaction.type} fade-in">
                        <div class="transaction-details">
                            <div class="transaction-description">${transaction.description
                }</div>
                            <div class="transaction-meta">
                                <span class="category-badge">${transaction.category
                }</span>
                                <span>📅 ${new Date(
                    transaction.date
                ).toLocaleDateString("en-IN")}</span>
                                <span>🕒 ${new Date(
                    transaction.timestamp
                ).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                })}</span>
                            </div>
                        </div>
                        <div class="transaction-amount ${transaction.type}">
                            ${transaction.type === "income" ? "+" : "-"
                }₹${transaction.amount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                })}
                        </div>
                        <div class="transaction-actions">
                            <button class="edit-btn" onclick="editTransaction('${transaction.id
                }')" title="Edit Transaction">
                                ✏️
                            </button>
                            <button class="delete-btn" onclick="deleteTransaction('${transaction.id
                }')" title="Delete Transaction">
                                🗑️
                            </button>
                        </div>
                    </div>
                `
        )
        .join("");
}

function updateCharts() {
    updateExpenseChart();
    updateMonthlyTrend();
}

function updateExpenseChart() {
    const expenseTransactions = transactions.filter(
        (t) => t.type === "expense"
    );
    if (expenseTransactions.length === 0) return;

    const categoryTotals = {};
    expenseTransactions.forEach((t) => {
        categoryTotals[t.category] =
            (categoryTotals[t.category] || 0) + t.amount;
    });

    const sortedCategories = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    const chartContainer = document.getElementById("expenseChart");
    chartContainer.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-weight: 600; margin-bottom: 15px; color: var(--dark);">Top Expense Categories</div>
                    ${sortedCategories
            .map(
                ([category, amount], index) => `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 8px; background: var(--gray-light); border-radius: 8px;">
                            <span style="font-size: 0.9rem;">${category}</span>
                            <span style="font-weight: 600; color: var(--danger);">₹${amount.toLocaleString(
                    "en-IN"
                )}</span>
                        </div>
                    `
            )
            .join("")}
                </div>
            `;
}

function updateMonthlyTrend() {
    const monthlyData = {};
    const last6Months = [];

    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}`;
        monthlyData[monthKey] = { income: 0, expense: 0 };
        last6Months.push(monthKey);
    }

    transactions.forEach((t) => {
        const monthKey = t.date.substring(0, 7);
        if (monthlyData[monthKey]) {
            monthlyData[monthKey][t.type] += t.amount;
        }
    });

    const trendContainer = document.getElementById("monthlyTrend");
    trendContainer.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-weight: 600; margin-bottom: 15px; color: var(--dark);">Monthly Overview</div>
                    ${last6Months
            .slice(-3)
            .map((month) => {
                const data = monthlyData[month];
                const monthName = new Date(
                    month + "-01"
                ).toLocaleDateString("en-IN", { month: "short" });
                const balance = data.income - data.expense;
                return `
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 8px; background: var(--gray-light); border-radius: 8px;">
                                <span style="font-size: 0.9rem; font-weight: 600;">${monthName}</span>
                                <span style="font-weight: 600; color: ${balance >= 0
                        ? "var(--success)"
                        : "var(--danger)"
                    };">
                                    ${balance >= 0 ? "+" : ""
                    }₹${balance.toLocaleString("en-IN")}
                                </span>
                            </div>
                        `;
            })
            .join("")}
                </div>
            `;
}

function exportToCSV() {
    if (transactions.length === 0) {
        showNotification("No transactions to export", "error");
        return;
    }

    const headers = ["Date", "Type", "Category", "Description", "Amount"];
    const csvContent = [
        headers.join(","),
        ...transactions.map((t) =>
            [t.date, t.type, t.category, `"${t.description}"`, t.amount].join(
                ","
            )
        ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `money-maven-transactions-${new Date().toISOString().split("T")[0]
        }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showNotification("Transactions exported successfully!", "success");
}

function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 10px;
                color: white;
                font-weight: 600;
                z-index: 10000;
                animation: slideIn 0.3s ease;
                max-width: 300px;
                box-shadow: var(--shadow-lg);
            `;

    const colors = {
        success: "var(--gradient-success)",
        error: "var(--gradient-danger)",
        info: "var(--gradient-primary)",
    };

    notification.style.background = colors[type] || colors.info;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = "slideOut 0.3s ease";
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}
const style = document.createElement("style");
style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
document.head.appendChild(style);
