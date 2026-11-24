namespace MoneyDoPaizao.Application.Customers;

public sealed record CustomerCreateRequest(
    string Name,
    bool HasReferral,
    string? Referral,
    string? Phone = null);

public sealed record CustomerResponse(
    Guid Id,
    string Name,
    bool HasReferral,
    string? Referral,
    DateTime CreatedAtUtc,
    string? Phone = null);
