using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using MoneyDoPaizao.Application.Auth;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Infrastructure.Security;

public sealed class JwtTokenService(IConfiguration configuration) : ITokenService
{
    public AuthResponse CreateToken(User user, ProductModule? activeModule = null)
    {
        var key = configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key não foi configurada.");
        var issuer = configuration["Jwt:Issuer"] ?? "MoneyDoPaizao.Api";
        var audience = configuration["Jwt:Audience"] ?? "MoneyDoPaizao.Mobile";
        var expirationMinutes = int.TryParse(configuration["Jwt:ExpirationInMinutes"], out var minutes) ? minutes : 120;

        var modules = user.Account?.Modules
            .Where(item => item.Active)
            .Select(item => item.Module)
            .Distinct()
            .ToList() ?? new List<ProductModule>();
        if (modules.Count == 0)
        {
            modules.Add(user.Account?.Module ?? ProductModule.Loans);
        }

        var selectedModule = activeModule ?? modules[0];
        if (!modules.Contains(selectedModule))
        {
            throw new InvalidOperationException("O módulo selecionado não pertence à conta.");
        }

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("accountId", user.AccountId.ToString()),
            new Claim("module", selectedModule.ToString())
        };
        claims.AddRange(modules.Select(module => new Claim("availableModule", module.ToString())));

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
            user.Role.ToString(),
            user.AccountId,
            modules.Select(module => module.ToString()).ToList(),
            activeModule?.ToString());
    }
}
