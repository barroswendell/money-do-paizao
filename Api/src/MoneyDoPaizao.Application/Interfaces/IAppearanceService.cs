using MoneyDoPaizao.Application.Settings;

namespace MoneyDoPaizao.Application.Interfaces;

public interface IAppearanceService
{
    Task<AppearanceResponse> GetAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<AppearanceResponse> UpdateAsync(Guid accountId, UpdateAppearanceRequest request, CancellationToken cancellationToken = default);
}
