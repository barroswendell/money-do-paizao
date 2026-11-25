using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Domain.Entities;

public sealed class Loan : IManagedRecord
{
    public DateTime? DeactivatedAtUtc { get; private set; }

    public void Deactivate(DateTime atUtc) => DeactivatedAtUtc ??= atUtc;

    public string? Notes { get; private set; }

    public void Update(Guid customerId, decimal principalAmount, int dueDay, decimal monthlyInterestRatePercent,
        decimal lateDailyInterestRatePercent, string? notes)
    {
        CustomerId = customerId;
        PrincipalAmount = principalAmount;
        DueDay = dueDay;
        MonthlyInterestRatePercent = monthlyInterestRatePercent;
        LateDailyInterestRatePercent = lateDailyInterestRatePercent;
        Notes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim();
    }

    private Loan()
    {
    }

    private Loan(
        Guid accountId,
        Guid customerId,
        decimal principalAmount,
        int dueDay,
        decimal monthlyInterestRatePercent,
        decimal lateDailyInterestRatePercent)
    {
        Id = Guid.NewGuid();
        AccountId = accountId;
        CustomerId = customerId;
        PrincipalAmount = principalAmount;
        DueDay = dueDay;
        MonthlyInterestRatePercent = monthlyInterestRatePercent;
        LateDailyInterestRatePercent = lateDailyInterestRatePercent;
        Status = LoanStatus.Active;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid AccountId { get; private set; }
    public Guid CustomerId { get; private set; }
    public Customer? Customer { get; private set; }
    public decimal PrincipalAmount { get; private set; }
    public int DueDay { get; private set; }
    public decimal MonthlyInterestRatePercent { get; private set; }
    public decimal LateDailyInterestRatePercent { get; private set; }
    public LoanStatus Status { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public ICollection<LoanPayment> Payments { get; private set; } = new List<LoanPayment>();

    public static Loan Create(
        Guid accountId,
        Guid customerId,
        decimal principalAmount,
        int dueDay,
        decimal monthlyInterestRatePercent,
        decimal lateDailyInterestRatePercent,
        string? notes = null)
    {
        return new Loan(accountId, customerId, principalAmount, dueDay, monthlyInterestRatePercent, lateDailyInterestRatePercent)
        {
            Notes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim()
        };
    }

    public void AttachCustomer(Customer customer)
    {
        Customer = customer;
    }

    public void MarkAsPaid()
    {
        Status = LoanStatus.Paid;
    }
}
