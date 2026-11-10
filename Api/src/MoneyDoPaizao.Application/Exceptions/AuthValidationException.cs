namespace MoneyDoPaizao.Application.Exceptions;

public sealed class AuthValidationException(string message) : Exception(message);
