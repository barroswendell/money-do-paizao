namespace MoneyDoPaizao.Application.Loans;

public sealed record LoanCreateRequest(
    Guid CustomerId,
    decimal PrincipalAmount,
    int DueDay,
    decimal MonthlyInterestRatePercent,
    decimal LateDailyInterestRatePercent);

public sealed record LoanPaymentRequest(string Type);

public sealed record LoanResponse(
    Guid Id,
    Guid CustomerId,
    string CustomerName,
    decimal PrincipalAmount,
    int DueDay,
    decimal MonthlyInterestRatePercent,
    decimal LateDailyInterestRatePercent,
    DateTime DueDate,
    int DaysLate,
    decimal InterestDue,
    decimal TotalDue,
    string Status,
    decimal PaidInterest);
