using MoneyDoPaizao.Application.Exceptions;
using MoneyDoPaizao.Application.Finance;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Application.Services;

public sealed class PersonalFinanceService(IPersonalFinanceRepository repository, IManagedRecordStore records) : IPersonalFinanceService
{
    public async Task<FinanceEntryResponse> CreateAsync(Guid accountId, FinanceEntryCreateRequest request, CancellationToken cancellationToken = default)
    {
        Validate(request);
        var entry = FinanceEntry.Create(accountId, request.Type, request.Amount, request.EntryDate, request.Category, request.Description);
        await repository.AddAsync(entry, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return Map(entry);
    }

    public async Task<FinanceEntryResponse?> UpdateAsync(Guid accountId, Guid id, FinanceEntryCreateRequest request, CancellationToken cancellationToken = default)
    {
        var entry = await records.ChangeAsync<FinanceEntry>(accountId, ProductModule.PersonalFinance, id, current =>
        {
            Validate(request);
            current.Update(request.Type, request.Amount, request.EntryDate, request.Category, request.Description);
            return Task.CompletedTask;
        }, cancellationToken);
        return entry is null ? null : Map(entry);
    }

    private static void Validate(FinanceEntryCreateRequest request)
    {
        if (request.Amount <= 0 || request.Amount > 9_999_999_999_999_999.99m || request.Amount != decimal.Round(request.Amount, 2))
        {
            throw new BusinessValidationException("Informe um valor maior que zero.");
        }

        if (string.IsNullOrWhiteSpace(request.Category) || request.Category.Trim().Length > 120)
        {
            throw new BusinessValidationException("Informe uma categoria.");
        }

        if (request.Type is not FinanceEntryType.Income and not FinanceEntryType.Expense)
        {
            throw new BusinessValidationException("Tipo de lançamento inválido.");
        }

        if (request.EntryDate == default)
            throw new BusinessValidationException("Informe a data do lançamento.");
        if (request.Description?.Trim().Length > 240)
            throw new BusinessValidationException("A descrição pode ter até 240 caracteres.");
    }

    public async Task<IReadOnlyList<FinanceEntryResponse>> GetEntriesAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        var entries = await repository.GetEntriesAsync(accountId, cancellationToken);
        return entries.Select(Map).ToList();
    }

    public async Task<PersonalFinanceSummaryResponse> GetSummaryAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var entries = (await repository.GetEntriesAsync(accountId, cancellationToken))
            .Where(item => item.EntryDate.Year == now.Year && item.EntryDate.Month == now.Month)
            .ToList();
        var income = entries.Where(item => item.Type == FinanceEntryType.Income).Sum(item => item.Amount);
        var expenses = entries.Where(item => item.Type == FinanceEntryType.Expense).Sum(item => item.Amount);
        return new PersonalFinanceSummaryResponse(income, expenses, income - expenses, entries.Count);
    }

    private static FinanceEntryResponse Map(FinanceEntry entry) => new(
        entry.Id,
        entry.Type,
        entry.Amount,
        entry.EntryDate,
        entry.Category,
        entry.Description,
        entry.CreatedAtUtc);
}

public interface IPersonalFinanceService
{
    Task<FinanceEntryResponse> CreateAsync(Guid accountId, FinanceEntryCreateRequest request, CancellationToken cancellationToken = default);
    Task<FinanceEntryResponse?> UpdateAsync(Guid accountId, Guid id, FinanceEntryCreateRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<FinanceEntryResponse>> GetEntriesAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<PersonalFinanceSummaryResponse> GetSummaryAsync(Guid accountId, CancellationToken cancellationToken = default);
}
