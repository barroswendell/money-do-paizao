using Microsoft.EntityFrameworkCore;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Infrastructure.Persistence;

namespace MoneyDoPaizao.Infrastructure.Repositories;

public sealed class PartyRepository(MoneyDoPaizaoDbContext context) : IPartyRepository
{
    public async Task<IReadOnlyList<PartyTheme>> GetThemesAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        return await context.PartyThemes
            .Where(item => item.AccountId == accountId)
            .AsNoTracking()
            .OrderBy(item => item.Name)
            .ToListAsync(cancellationToken);
    }

    public Task<PartyTheme?> GetThemeAsync(Guid accountId, Guid id, CancellationToken cancellationToken = default)
    {
        return context.PartyThemes.SingleOrDefaultAsync(item => item.AccountId == accountId && item.Id == id, cancellationToken);
    }

    public async Task AddThemeAsync(PartyTheme theme, CancellationToken cancellationToken = default)
    {
        await context.PartyThemes.AddAsync(theme, cancellationToken);
    }

    public async Task<IReadOnlyList<PartyProduct>> GetProductsAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        return await context.PartyProducts.AsNoTracking()
            .Where(item => item.AccountId == accountId)
            .OrderBy(item => item.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<PartyProduct>> GetProductsByIdsAsync(Guid accountId, IReadOnlyCollection<Guid> ids, CancellationToken cancellationToken = default)
    {
        return await context.PartyProducts.AsNoTracking()
            .Where(item => item.AccountId == accountId && ids.Contains(item.Id))
            .ToListAsync(cancellationToken);
    }

    public async Task AddProductAsync(PartyProduct product, CancellationToken cancellationToken = default)
    {
        await context.PartyProducts.AddAsync(product, cancellationToken);
    }

    public async Task<IReadOnlyList<PartyEvent>> GetEventsAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        return await EventsWithDetails(accountId)
            .AsNoTracking()
            .OrderBy(item => item.EventDate)
            .ToListAsync(cancellationToken);
    }

    public Task<PartyEvent?> GetEventAsync(Guid accountId, Guid id, CancellationToken cancellationToken = default) =>
        EventsWithDetails(accountId).SingleOrDefaultAsync(item => item.Id == id, cancellationToken);

    public async Task<IReadOnlyList<PartyEvent>> GetEventsForDashboardAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        return await context.PartyEvents.AsNoTracking()
            .Where(item => item.AccountId == accountId)
            .ToListAsync(cancellationToken);
    }

    private IQueryable<PartyEvent> EventsWithDetails(Guid accountId) => context.PartyEvents
        .Where(item => item.AccountId == accountId)
        .Include(item => item.Customer)
        .Include(item => item.Theme)
        .Include(item => item.Products);

    public async Task AddEventAsync(PartyEvent partyEvent, CancellationToken cancellationToken = default)
    {
        await context.PartyEvents.AddAsync(partyEvent, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => context.SaveChangesAsync(cancellationToken);
}
