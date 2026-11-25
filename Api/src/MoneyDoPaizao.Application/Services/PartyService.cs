using System.Globalization;
using MoneyDoPaizao.Application.Exceptions;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Application.Parties;
using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Application.Services;

public sealed class PartyService(
    IPartyRepository partyRepository,
    ICustomerRepository customerRepository,
    IManagedRecordStore records) : IPartyService
{
    private const decimal MaxAmount = 9_999_999_999_999_999.99m;
    private static readonly TimeZoneInfo PartyTimeZone = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");

    public async Task<PartyThemeResponse> CreateThemeAsync(Guid accountId, PartyThemeCreateRequest request, CancellationToken cancellationToken = default)
    {
        ValidateTheme(request);
        var theme = PartyTheme.Create(accountId, request.Name, request.Description);
        await partyRepository.AddThemeAsync(theme, cancellationToken);
        await partyRepository.SaveChangesAsync(cancellationToken);
        return Map(theme);
    }

    public async Task<PartyThemeResponse?> UpdateThemeAsync(Guid accountId, Guid id, PartyThemeCreateRequest request, CancellationToken cancellationToken = default)
    {
        var theme = await records.ChangeAsync<PartyTheme>(accountId, ProductModule.Parties, id, current =>
        {
            ValidateTheme(request);
            current.Update(request.Name, request.Description);
            return Task.CompletedTask;
        }, cancellationToken);
        return theme is null ? null : Map(theme);
    }

    private static void ValidateTheme(PartyThemeCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Trim().Length > 160)
            throw new BusinessValidationException("Informe o nome do tema com até 160 caracteres.");
        if (request.Description?.Trim().Length > 240)
            throw new BusinessValidationException("A descrição do tema pode ter até 240 caracteres.");
    }

    public async Task<IReadOnlyList<PartyThemeResponse>> GetThemesAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        var themes = await partyRepository.GetThemesAsync(accountId, cancellationToken);
        return themes.Select(Map).ToList();
    }

    public async Task<PartyProductResponse> CreateProductAsync(Guid accountId, PartyProductCreateRequest request, CancellationToken cancellationToken = default)
    {
        ValidateProduct(request);
        var product = PartyProduct.Create(accountId, request.Name, request.Notes);
        await partyRepository.AddProductAsync(product, cancellationToken);
        await partyRepository.SaveChangesAsync(cancellationToken);
        return Map(product);
    }

    public async Task<PartyProductResponse?> UpdateProductAsync(Guid accountId, Guid id, PartyProductCreateRequest request, CancellationToken cancellationToken = default)
    {
        var product = await records.ChangeAsync<PartyProduct>(accountId, ProductModule.Parties, id, current =>
        {
            ValidateProduct(request);
            current.Update(request.Name, request.Notes);
            return Task.CompletedTask;
        }, cancellationToken);
        return product is null ? null : Map(product);
    }

    private static void ValidateProduct(PartyProductCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Trim().Length > 160)
        {
            throw new BusinessValidationException("Informe um nome de produto com até 160 caracteres.");
        }

        if (request.Notes?.Trim().Length > 500)
        {
            throw new BusinessValidationException("A observação do produto pode ter até 500 caracteres.");
        }
    }

    public async Task<IReadOnlyList<PartyProductResponse>> GetProductsAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        var products = await partyRepository.GetProductsAsync(accountId, cancellationToken);
        return products.Select(Map).ToList();
    }

    public async Task<PartyEventResponse> CreateEventAsync(Guid accountId, PartyEventCreateRequest request, CancellationToken cancellationToken = default)
    {
        var draft = await PrepareEventAsync(accountId, request, null, cancellationToken);
        var partyEvent = PartyEvent.Create(accountId, request.CustomerId, request.ThemeId, request.EventDate,
            draft.Total, request.DepositReceived, draft.Deposit, request.Notes, draft.Lines.Select(item => item.Line).ToList(), draft.Received);
        partyEvent.AttachReferences(draft.Customer, draft.Theme);
        await partyRepository.AddEventAsync(partyEvent, cancellationToken);
        await partyRepository.SaveChangesAsync(cancellationToken);
        return Map(partyEvent);
    }

    public async Task<PartyEventResponse?> UpdateEventAsync(Guid accountId, Guid id, PartyEventCreateRequest request, CancellationToken cancellationToken = default)
    {
        var partyEvent = await records.ChangeAsync<PartyEvent>(accountId, ProductModule.Parties, id, async current =>
        {
            var draft = await PrepareEventAsync(accountId, request, current, cancellationToken);
            var retained = draft.Lines.Select(item => item.Line.Id).ToHashSet();
            var timestamp = DateTime.UtcNow;
            foreach (var line in current.Products.Where(item => item.DeactivatedAtUtc is null && !retained.Contains(item.Id)))
                line.Deactivate(timestamp);
            foreach (var item in draft.Lines)
            {
                item.Line.Update(item.Request.Amount, item.Request.IsGift);
                if (item.Request.Id is null) current.Products.Add(item.Line);
            }
            current.AttachReferences(draft.Customer, draft.Theme);
            current.UpdateDetails(request.EventDate, draft.Total, draft.Deposit, request.Notes, draft.Received);
        }, cancellationToken);
        return partyEvent is null ? null : Map(partyEvent);
    }

    private async Task<EventDraft> PrepareEventAsync(Guid accountId, PartyEventCreateRequest request, PartyEvent? current, CancellationToken cancellationToken)
    {
        if (request.EventDate == default)
            throw new BusinessValidationException("Informe a data da festa.");
        if (!IsValidAmount(request.TotalAmount))
            throw new BusinessValidationException("Informe um valor base válido para a festa.");
        if (request.Notes?.Trim().Length > 500)
            throw new BusinessValidationException("A observação da festa pode ter até 500 caracteres.");

        var customer = current?.CustomerId == request.CustomerId && current.Customer is not null
            ? current.Customer
            : await customerRepository.GetByIdAsync(accountId, ProductModule.Parties, request.CustomerId, cancellationToken)
                ?? throw new BusinessValidationException("O cliente selecionado não foi encontrado.");

        PartyTheme? theme = null;
        if (request.ThemeId is { } themeId)
        {
            theme = current?.ThemeId == themeId && current.Theme is not null ? current.Theme
                : await partyRepository.GetThemeAsync(accountId, themeId, cancellationToken)
                    ?? throw new BusinessValidationException("O tema selecionado não foi encontrado.");
        }

        var existingLines = current?.Products.Where(item => item.DeactivatedAtUtc is null).ToDictionary(item => item.Id) ?? [];
        var requestedLines = request.Products ??
            existingLines.Values.Select(item => new PartyEventProductRequest(item.ProductId, item.Amount, item.IsGift, item.Id)).ToList();
        var lines = await ResolveEventProductsAsync(accountId, requestedLines, existingLines, cancellationToken);
        // TotalAmount represents the base price. Products are priced separately.
        var total = request.TotalAmount + lines.Sum(item => item.Request.IsGift ? 0 : item.Request.Amount);
        if (total <= 0 || total > MaxAmount)
            throw new BusinessValidationException("Informe um valor total válido para a festa.");

        var deposit = request.DepositReceived ? request.DepositAmount : 0;
        if (!IsValidAmount(deposit) || deposit > total)
            throw new BusinessValidationException("O sinal deve ficar entre zero e o valor total.");

        var received = request.ReceivedAmount ?? current?.ReceivedAmount ?? deposit;
        ValidateReceivedAmount(received, deposit, total);
        return new EventDraft(customer, theme, total, deposit, received, lines);
    }

    public async Task<PartyEventResponse?> UpdateReceivedAmountAsync(Guid accountId, Guid eventId, PartyEventReceivedAmountRequest request, CancellationToken cancellationToken = default)
    {
        var partyEvent = await records.ChangeAsync<PartyEvent>(accountId, ProductModule.Parties, eventId, current =>
        {
            ValidateReceivedAmount(request.ReceivedAmount, current.DepositAmount, current.TotalAmount);
            current.SetReceivedAmount(request.ReceivedAmount);
            return Task.CompletedTask;
        }, cancellationToken);
        return partyEvent is null ? null : Map(partyEvent);
    }

    public async Task<IReadOnlyList<PartyEventResponse>> GetEventsAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        var events = await partyRepository.GetEventsAsync(accountId, cancellationToken);
        return events.Select(Map).ToList();
    }

    public async Task<PartyDashboardResponse> GetDashboardAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        var events = await partyRepository.GetEventsForDashboardAsync(accountId, cancellationToken);
        var today = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, PartyTimeZone).Date;
        var currentMonth = MonthKey(today);
        var monthly = events.GroupBy(item => MonthKey(item.EventDate)).ToDictionary(group => group.Key, group => group.ToList());
        var months = monthly.Select(entry => new PartyMonthResponse(
            entry.Key, entry.Value.Count, entry.Value.Sum(item => item.TotalAmount),
            entry.Value.Sum(item => item.ReceivedAmount), entry.Value.Sum(item => item.RemainingAmount)))
            .OrderBy(item => item.Month, StringComparer.Ordinal).ToList();
        var currentEvents = monthly.GetValueOrDefault(currentMonth) ?? [];
        return new PartyDashboardResponse(
            events.Count(item => item.EventDate >= today && item.Status == "Scheduled"),
            currentEvents.Sum(item => item.TotalAmount),
            currentEvents.Sum(item => item.DepositAmount),
            currentEvents.Sum(item => item.RemainingAmount),
            currentMonth,
            months);
    }

    private async Task<IReadOnlyList<ProductLine>> ResolveEventProductsAsync(Guid accountId, IReadOnlyList<PartyEventProductRequest> items,
        Dictionary<Guid, PartyEventProduct> existing, CancellationToken cancellationToken)
    {
        if (items.Count == 0) return [];
        if (items.Any(item => item is null))
            throw new BusinessValidationException("Selecione um produto válido para a festa.");
        if (items.Any(item => !item.IsGift && (!IsValidAmount(item.Amount) || item.Amount == 0)))
            throw new BusinessValidationException("Informe um valor maior que zero para cada produto que não for brinde.");

        var newCatalogIds = items.Where(item => item.Id is null).Select(item => item.ProductId).ToHashSet();
        var catalog = newCatalogIds.Count == 0 ? [] :
            (await partyRepository.GetProductsByIdsAsync(accountId, newCatalogIds, cancellationToken)).ToDictionary(item => item.Id);
        if (catalog.Count != newCatalogIds.Count)
            throw new BusinessValidationException("Um dos produtos selecionados não foi encontrado.");

        var seen = new HashSet<Guid>();
        var lines = new List<ProductLine>(items.Count);
        foreach (var item in items)
        {
            if (item.Id is not { } lineId)
            {
                lines.Add(new ProductLine(PartyEventProduct.Create(catalog[item.ProductId], item.Amount, item.IsGift), item));
                continue;
            }
            if (!seen.Add(lineId) || !existing.TryGetValue(lineId, out var line) || line.ProductId != item.ProductId)
                throw new BusinessValidationException("Um dos itens não pertence a esta festa. Atualize a tela e tente novamente.");
            lines.Add(new ProductLine(line, item));
        }
        return lines;
    }

    private sealed record ProductLine(PartyEventProduct Line, PartyEventProductRequest Request);
    private sealed record EventDraft(Customer Customer, PartyTheme? Theme, decimal Total, decimal Deposit, decimal Received,
        IReadOnlyList<ProductLine> Lines);

    private static bool IsValidAmount(decimal amount) => amount >= 0 && amount <= MaxAmount && amount == decimal.Round(amount, 2);

    private static void ValidateReceivedAmount(decimal amount, decimal deposit, decimal total)
    {
        if (!IsValidAmount(amount) || amount < deposit || amount > total)
        {
            throw new BusinessValidationException("O valor recebido deve ficar entre o sinal e o valor total da festa.");
        }
    }

    private static string MonthKey(DateTime date) => date.ToString("yyyy-MM", CultureInfo.InvariantCulture);

    private static PartyThemeResponse Map(PartyTheme theme) => new(theme.Id, theme.Name, theme.Description, theme.CreatedAtUtc);

    private static PartyProductResponse Map(PartyProduct product) => new(product.Id, product.Name, product.Notes);

    private static PartyEventResponse Map(PartyEvent partyEvent) => new(
        partyEvent.Id,
        partyEvent.CustomerId,
        partyEvent.Customer?.Name ?? "Cliente",
        partyEvent.ThemeId,
        partyEvent.Theme?.Name,
        partyEvent.EventDate,
        partyEvent.TotalAmount,
        partyEvent.DepositReceived,
        partyEvent.DepositAmount,
        partyEvent.RemainingAmount,
        partyEvent.Notes,
        partyEvent.Status,
        partyEvent.TotalAmount - partyEvent.Products.Where(item => item.DeactivatedAtUtc is null).Sum(item => item.Amount),
        partyEvent.ReceivedAmount,
        partyEvent.Products.Where(item => item.DeactivatedAtUtc is null).OrderBy(item => item.ProductName)
            .Select(item => new PartyEventProductResponse(item.Id, item.ProductId, item.ProductName, item.Amount, item.IsGift))
            .ToList());
}

public interface IPartyService
{
    Task<PartyThemeResponse> CreateThemeAsync(Guid accountId, PartyThemeCreateRequest request, CancellationToken cancellationToken = default);
    Task<PartyThemeResponse?> UpdateThemeAsync(Guid accountId, Guid id, PartyThemeCreateRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PartyThemeResponse>> GetThemesAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<PartyProductResponse> CreateProductAsync(Guid accountId, PartyProductCreateRequest request, CancellationToken cancellationToken = default);
    Task<PartyProductResponse?> UpdateProductAsync(Guid accountId, Guid id, PartyProductCreateRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PartyProductResponse>> GetProductsAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<PartyEventResponse> CreateEventAsync(Guid accountId, PartyEventCreateRequest request, CancellationToken cancellationToken = default);
    Task<PartyEventResponse?> UpdateEventAsync(Guid accountId, Guid id, PartyEventCreateRequest request, CancellationToken cancellationToken = default);
    Task<PartyEventResponse?> UpdateReceivedAmountAsync(Guid accountId, Guid eventId, PartyEventReceivedAmountRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PartyEventResponse>> GetEventsAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<PartyDashboardResponse> GetDashboardAsync(Guid accountId, CancellationToken cancellationToken = default);
}
