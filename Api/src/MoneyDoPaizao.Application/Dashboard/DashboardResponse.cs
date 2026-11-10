namespace MoneyDoPaizao.Application.Dashboard;

public sealed record DashboardResponse(
    int TotalCustomers,
    decimal TotalLent,
    decimal TotalProfit,
    int CustomersOnTime,
    int CustomersOverdue);
