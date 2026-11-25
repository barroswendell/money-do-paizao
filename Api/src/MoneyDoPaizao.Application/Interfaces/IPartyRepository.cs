using MoneyDoPaizao.Domain.Entities;

namespace MoneyDoPaizao.Application.Interfaces;

public interface IPartyRepository
{
    Task<IReadOnlyList<PartyTheme>> GetThemesAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<PartyTheme?> GetThemeAsync(Guid accountId, Guid id, CancellationToken cancellationToken = default);
    Task AddThemeAsync(PartyTheme theme, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PartyProduct>> GetProductsAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PartyProduct>> GetProductsByIdsAsync(Guid accountId, IReadOnlyCollection<Guid> ids, CancellationToken cancellationToken = default);
    Task AddProductAsync(PartyProduct product, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PartyEvent>> GetEventsAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PartyEvent>> GetEventsForDashboardAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task AddEventAsync(PartyEvent partyEvent, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
