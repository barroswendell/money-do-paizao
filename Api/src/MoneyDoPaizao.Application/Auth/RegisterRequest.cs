using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Application.Auth;

public sealed record RegisterRequest(
    string Name,
    string Email,
    string? Phone,
    DateTime BirthDate,
    string Password,
    string ConfirmPassword,
    IReadOnlyCollection<ProductModule> Modules);
