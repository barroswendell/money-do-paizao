using System.Text.RegularExpressions;
using MoneyDoPaizao.Application.Exceptions;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Application.Settings;
using MoneyDoPaizao.Domain.Entities;

namespace MoneyDoPaizao.Application.Services;

public sealed class AppearanceService(IAccountRepository accountRepository) : IAppearanceService
{
    private static readonly Regex HexColor = new("^#[0-9A-Fa-f]{6}$", RegexOptions.Compiled);

    public async Task<AppearanceResponse> GetAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        var account = await accountRepository.GetByIdAsync(accountId, cancellationToken)
            ?? throw new BusinessValidationException("A conta não foi encontrada.");

        return Map(account);
    }

    public async Task<AppearanceResponse> UpdateAsync(Guid accountId, UpdateAppearanceRequest request, CancellationToken cancellationToken = default)
    {
        var primaryColor = NormalizeColor(request.PrimaryColor, "A cor primária");
        var secondaryColor = NormalizeColor(request.SecondaryColor, "A cor secundária");
        var account = await accountRepository.GetByIdAsync(accountId, cancellationToken)
            ?? throw new BusinessValidationException("A conta não foi encontrada.");

        account.UpdateAppearance(request.UseCustomTheme, primaryColor, secondaryColor, request.IsDarkMode);
        await accountRepository.SaveChangesAsync(cancellationToken);
        return Map(account);
    }

    private static string NormalizeColor(string? color, string fieldName)
    {
        var normalized = color?.Trim().ToUpperInvariant() ?? string.Empty;
        if (!HexColor.IsMatch(normalized))
        {
            throw new BusinessValidationException($"{fieldName} deve estar no formato #RRGGBB.");
        }

        return normalized;
    }

    private static AppearanceResponse Map(Account account) => new(
        account.UseCustomTheme,
        account.PrimaryColor,
        account.SecondaryColor,
        account.IsDarkMode);
}
