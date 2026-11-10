namespace MoneyDoPaizao.Application.Auth;

public sealed record RegisterRequest(
    string Name,
    string Email,
    string Cpf,
    DateTime BirthDate,
    string Password,
    string ConfirmPassword);
