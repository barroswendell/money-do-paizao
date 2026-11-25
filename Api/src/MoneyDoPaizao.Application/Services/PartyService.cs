using System.Globalization;
using MoneyDoPaizao.Application.Exceptions;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Application.Parties;
using MoneyDoPaizao.Domain.Entities;

namespace MoneyDoPaizao.Application.Services;

public sealed class PartyService(
    IPartyRepository partyRepository,
    ICustomerRepository customerRepository) : IPartyService
{
    private const decimal MaxAmount = 9_999_999_999_999_999.99m;
    private static readonly TimeZoneInfo PartyTimeZone = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");

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

    public async Task<PartyProductResponse> CreateProductAsync(Guid accountId, PartyProductCreateRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Trim().Length > 160)
        {
            throw new BusinessValidationException("Informe um nome de produto com até 160 caracteres.");
        }

        if (request.Notes?.Trim().Length > 500)
        {
            throw new BusinessValidationException("A observação do produto pode ter até 500 caracteres.");
        }

        var product = PartyProduct.Create(accountId, request.Name, request.Notes);
        await partyRepository.AddProductAsync(product, cancellationToken);
        await partyRepository.SaveChangesAsync(cancellationToken);
        return Map(product);
    }

    public async Task<IReadOnlyList<PartyProductResponse>> GetProductsAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        var products = await partyRepository.GetProductsAsync(accountId, cancellationToken);
        return products.Select(Map).ToList();
    }

    public async Task<PartyEventResponse> CreateEventAsync(Guid accountId, PartyEventCreateRequest request, CancellationToken cancellationToken = default)
    {
        if (request.EventDate == default)
        {
            throw new BusinessValidationException("Informe a data da festa.");
        }

        if (!IsValidAmount(request.TotalAmount))
        {
            throw new BusinessValidationException("Informe um valor base válido para a festa.");
        }

        if (request.Notes?.Trim().Length > 500)
        {
            throw new BusinessValidationException("A observação da festa pode ter até 500 caracteres.");
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

        var products = await ResolveEventProductsAsync(accountId, request.Products ?? [], cancellationToken);
        // TotalAmount was the full event price before optional products were introduced.
        var totalAmount = request.TotalAmount + products.Sum(item => item.Amount);
        if (totalAmount <= 0 || totalAmount > MaxAmount)
        {
            throw new BusinessValidationException("Informe um valor total válido para a festa.");
        }

        var depositAmount = request.DepositReceived ? request.DepositAmount : 0;
        if (!IsValidAmount(depositAmount) || depositAmount > totalAmount)
        {
            throw new BusinessValidationException("O sinal deve ficar entre zero e o valor total.");
        }

        var receivedAmount = request.ReceivedAmount ?? depositAmount;
        ValidateReceivedAmount(receivedAmount, depositAmount, totalAmount);
        var partyEvent = PartyEvent.Create(
            accountId,
            request.CustomerId,
            request.ThemeId,
            request.EventDate,
            totalAmount,
            request.DepositReceived,
            depositAmount,
            request.Notes,
            products,
            receivedAmount);
        await partyRepository.AddEventAsync(partyEvent, cancellationToken);
        await partyRepository.SaveChangesAsync(cancellationToken);
        return Map(partyEvent, customer.Name, theme?.Name);
    }

    public async Task<PartyEventResponse?> UpdateReceivedAmountAsync(Guid accountId, Guid eventId, PartyEventReceivedAmountRequest request, CancellationToken cancellationToken = default)
    {
        var partyEvent = await partyRepository.GetEventAsync(accountId, eventId, cancellationToken);
        if (partyEvent is null)
        {
            return null;
        }

        ValidateReceivedAmount(request.ReceivedAmount, partyEvent.DepositAmount, partyEvent.TotalAmount);
        partyEvent.SetReceivedAmount(request.ReceivedAmount);
        await partyRepository.SaveChangesAsync(cancellationToken);
        return Map(partyEvent, partyEvent.Customer?.Name ?? "Cliente", partyEvent.Theme?.Name);
    }

    public async Task<IReadOnlyList<PartyEventResponse>> GetEventsAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        var events = await partyRepository.GetEventsAsync(accountId, cancellationToken);
        return events.Select(item => Map(item, item.Customer?.Name ?? "Cliente", item.Theme?.Name)).ToList();
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

    private async Task<IReadOnlyList<PartyEventProduct>> ResolveEventProductsAsync(
        Guid accountId, IReadOnlyList<PartyEventProductRequest> items, CancellationToken cancellationToken)
    {
        if (items.Count == 0)
        {
            return [];
        }

        if (items.Any(item => item is null))
        {
            throw new BusinessValidationException("Selecione um produto válido para a festa.");
        }

        var ids = items.Select(item => item.ProductId).ToHashSet();
        var catalog = (await partyRepository.GetProductsByIdsAsync(accountId, ids, cancellationToken)).ToDictionary(item => item.Id);
        if (catalog.Count != ids.Count)
        {
            throw new BusinessValidationException("Um dos produtos selecionados não foi encontrado.");
        }

        if (items.Any(item => !item.IsGift && (!IsValidAmount(item.Amount) || item.Amount == 0)))
        {
            throw new BusinessValidationException("Informe um valor maior que zero para cada produto que não for brinde.");
        }

        return items.Select(item => PartyEventProduct.Create(catalog[item.ProductId], item.Amount, item.IsGift)).ToList();
    }

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
        partyEvent.RemainingAmount,
        partyEvent.Notes,
        partyEvent.Status,
        partyEvent.TotalAmount - partyEvent.Products.Sum(item => item.Amount),
        partyEvent.ReceivedAmount,
        partyEvent.Products.OrderBy(item => item.ProductName)
            .Select(item => new PartyEventProductResponse(item.Id, item.ProductId, item.ProductName, item.Amount, item.IsGift))
            .ToList());
}

public interface IPartyService
{
    Task<PartyThemeResponse> CreateThemeAsync(Guid accountId, PartyThemeCreateRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PartyThemeResponse>> GetThemesAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<PartyProductResponse> CreateProductAsync(Guid accountId, PartyProductCreateRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PartyProductResponse>> GetProductsAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<PartyEventResponse> CreateEventAsync(Guid accountId, PartyEventCreateRequest request, CancellationToken cancellationToken = default);
    Task<PartyEventResponse?> UpdateReceivedAmountAsync(Guid accountId, Guid eventId, PartyEventReceivedAmountRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PartyEventResponse>> GetEventsAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<PartyDashboardResponse> GetDashboardAsync(Guid accountId, CancellationToken cancellationToken = default);
}
