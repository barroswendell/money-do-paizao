namespace MoneyDoPaizao.Application.Auth;

public sealed record AuthResponse(
    string Token,
    Guid UserId,
    string Name,
    string Email,
    string Role);
