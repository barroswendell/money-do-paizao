using MoneyDoPaizao.Application.Auth;
using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Application.Interfaces;

public interface ITokenService
{
    AuthResponse CreateToken(User user, ProductModule? activeModule = null);
}
