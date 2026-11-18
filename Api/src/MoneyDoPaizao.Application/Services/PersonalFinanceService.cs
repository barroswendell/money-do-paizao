using MoneyDoPaizao.Application.Exceptions;
using MoneyDoPaizao.Application.Finance;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Application.Services;

public sealed class PersonalFinanceService(IPersonalFinanceRepository repository) : IPersonalFinanceService
{
    public async Task<FinanceEntryResponse> CreateAsync(Guid accountId, FinanceEntryCreateRequest request, CancellationToken cancellationToken = default)
    {
        if (request.Amount <= 0)
        {
            throw new BusinessValidationException("Informe um valor maior que zero.");
        }

        if (string.IsNullOrWhiteSpace(request.Category))
        {
            throw new BusinessValidationException("Informe uma categoria.");
        }

        if (request.Type is not FinanceEntryType.Income and not FinanceEntryType.Expense)
        {
            throw new BusinessValidationException("Tipo de lançamento inválido.");
        }

        var entry = FinanceEntry.Create(accountId, request.Type, request.Amount, request.EntryDate, request.Category, request.Description);
        await repository.AddAsync(entry, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return Map(entry);
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
    Task<IReadOnlyList<FinanceEntryResponse>> GetEntriesAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<PersonalFinanceSummaryResponse> GetSummaryAsync(Guid accountId, CancellationToken cancellationToken = default);
}
