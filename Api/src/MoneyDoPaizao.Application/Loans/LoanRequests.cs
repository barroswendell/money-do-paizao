namespace MoneyDoPaizao.Application.Loans;

public sealed record LoanCreateRequest(
    Guid CustomerId,
    decimal PrincipalAmount,
    int DueDay,
    decimal MonthlyInterestRatePercent,
    decimal LateDailyInterestRatePercent);

public sealed record LoanPaymentRequest(string Type, Guid? RequestId = null);

public sealed record LoanPaymentAttachment(string Name, string ContentType, byte[] Content);

public sealed record LoanPaymentResponse(
    Guid Id,
    string Type,
    decimal Amount,
    decimal InterestAmount,
    decimal PrincipalAmount,
    DateTime PaidAtUtc,
    string? ReceiptName);

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
    decimal PaidInterest,
    IReadOnlyList<LoanPaymentResponse> Payments);
