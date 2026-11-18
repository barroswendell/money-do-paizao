using MoneyDoPaizao.Application.Exceptions;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Application.Parties;
using MoneyDoPaizao.Domain.Entities;

namespace MoneyDoPaizao.Application.Services;

public sealed class PartyService(
    IPartyRepository partyRepository,
    ICustomerRepository customerRepository) : IPartyService
{
    public async Task<PartyThemeResponse> CreateThemeAsync(Guid accountId, PartyThemeCreateRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new BusinessValidationException("Informe o nome do tema.");
        }

        var theme = PartyTheme.Create(accountId, request.Name, request.Description);
        await partyRepository.AddThemeAsync(theme, cancellationToken);
        await partyRepository.SaveChangesAsync(cancellationToken);
        return Map(theme);
    }

    public async Task<IReadOnlyList<PartyThemeResponse>> GetThemesAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        var themes = await partyRepository.GetThemesAsync(accountId, cancellationToken);
        return themes.Select(Map).ToList();
    }

    public async Task<PartyEventResponse> CreateEventAsync(Guid accountId, PartyEventCreateRequest request, CancellationToken cancellationToken = default)
    {
        if (request.EventDate.Date < DateTime.UtcNow.Date)
        {
            throw new BusinessValidationException("A data da festa não pode estar no passado.");
        }

        if (request.TotalAmount <= 0)
        {
            throw new BusinessValidationException("Informe o valor total da festa.");
        }

        if (request.DepositAmount < 0 || request.DepositAmount > request.TotalAmount)
        {
            throw new BusinessValidationException("O sinal deve ficar entre zero e o valor total.");
        }

        var customer = await customerRepository.GetByIdAsync(accountId, Domain.Enums.ProductModule.Parties, request.CustomerId, cancellationToken);
        if (customer is null)
        {
            throw new BusinessValidationException("O cliente selecionado não foi encontrado.");
        }

        PartyTheme? theme = null;
        if (request.ThemeId.HasValue)
        {
            theme = await partyRepository.GetThemeAsync(accountId, request.ThemeId.Value, cancellationToken);
            if (theme is null)
            {
                throw new BusinessValidationException("O tema selecionado não foi encontrado.");
            }
        }

        var partyEvent = PartyEvent.Create(
            accountId,
            request.CustomerId,
            request.ThemeId,
            request.EventDate,
            request.TotalAmount,
            request.DepositReceived,
            request.DepositReceived ? request.DepositAmount : 0,
            request.Notes);
        await partyRepository.AddEventAsync(partyEvent, cancellationToken);
        await partyRepository.SaveChangesAsync(cancellationToken);
        return Map(partyEvent, customer.Name, theme?.Name);
    }

    public async Task<IReadOnlyList<PartyEventResponse>> GetEventsAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        var events = await partyRepository.GetEventsAsync(accountId, cancellationToken);
        return events.Select(item => Map(item, item.Customer?.Name ?? "Cliente", item.Theme?.Name)).ToList();
    }

    public async Task<PartyDashboardResponse> GetDashboardAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        var events = await partyRepository.GetEventsAsync(accountId, cancellationToken);
        var now = DateTime.UtcNow;
        var monthEvents = events.Where(item => item.EventDate.Year == now.Year && item.EventDate.Month == now.Month).ToList();
        var upcoming = events.Count(item => item.EventDate.Date >= now.Date && item.Status == "Scheduled");
        var revenue = monthEvents.Sum(item => item.TotalAmount);
        var deposits = monthEvents.Sum(item => item.DepositAmount);
        return new PartyDashboardResponse(upcoming, revenue, deposits, revenue - deposits);
    }

    private static PartyThemeResponse Map(PartyTheme theme) => new(theme.Id, theme.Name, theme.Description, theme.CreatedAtUtc);

    private static PartyEventResponse Map(PartyEvent partyEvent, string customerName, string? themeName) => new(
        partyEvent.Id,
        partyEvent.CustomerId,
        customerName,
        partyEvent.ThemeId,
        themeName,
        partyEvent.EventDate,
        partyEvent.TotalAmount,
        partyEvent.DepositReceived,
        partyEvent.DepositAmount,
        partyEvent.TotalAmount - partyEvent.DepositAmount,
        partyEvent.Notes,
        partyEvent.Status);
}

public interface IPartyService
{
    Task<PartyThemeResponse> CreateThemeAsync(Guid accountId, PartyThemeCreateRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PartyThemeResponse>> GetThemesAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<PartyEventResponse> CreateEventAsync(Guid accountId, PartyEventCreateRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PartyEventResponse>> GetEventsAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<PartyDashboardResponse> GetDashboardAsync(Guid accountId, CancellationToken cancellationToken = default);
}
