using MoneyDoPaizao.Application.Auth;
using MoneyDoPaizao.Domain.Entities;

namespace MoneyDoPaizao.Application.Interfaces;

public interface ITokenService
{
    AuthResponse CreateToken(User user);
}
