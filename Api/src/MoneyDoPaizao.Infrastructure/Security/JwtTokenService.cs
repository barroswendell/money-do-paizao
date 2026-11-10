using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using MoneyDoPaizao.Application.Auth;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Domain.Entities;

namespace MoneyDoPaizao.Infrastructure.Security;

public sealed class JwtTokenService(IConfiguration configuration) : ITokenService
{
    public AuthResponse CreateToken(User user)
    {
        var key = configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key não foi configurada.");
        var issuer = configuration["Jwt:Issuer"] ?? "MoneyDoPaizao.Api";
        var audience = configuration["Jwt:Audience"] ?? "MoneyDoPaizao.Mobile";
        var expirationMinutes = int.TryParse(configuration["Jwt:ExpirationInMinutes"], out var minutes) ? minutes : 120;

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: credentials);

        return new AuthResponse(
            new JwtSecurityTokenHandler().WriteToken(token),
            user.Id,
            user.Name,
            user.Email,
            user.Role.ToString());
    }
}
