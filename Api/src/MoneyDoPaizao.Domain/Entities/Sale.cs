using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Domain.Entities;

public sealed class Sale : IManagedRecord
{
    public DateTime? DeactivatedAtUtc { get; private set; }

    public void Deactivate(DateTime atUtc) => DeactivatedAtUtc ??= atUtc;

    public void AttachReferences(Customer customer, Product product)
    {
        CustomerId = customer.Id;
        Customer = customer;
        ProductId = product.Id;
        Product = product;
    }

    public void UpdateTerms(Sale draft)
    {
        PaymentType = draft.PaymentType;
        PaidAtUtc = draft.PaymentType == SalePaymentType.Cash ? PaidAtUtc ?? draft.PaidAtUtc : null;
        Status = draft.Status;
        Amount = draft.Amount;
        UnitPrice = draft.UnitPrice;
        DownPaymentAmount = draft.DownPaymentAmount;
        InstallmentCount = draft.InstallmentCount;
        InstallmentAmount = draft.InstallmentAmount;
        LastInstallmentAmount = draft.LastInstallmentAmount;
        DueDate = draft.DueDate;
    }

    private Sale()
    {
    }

    private Sale(Guid accountId, Guid customerId, Guid productId, SalePaymentType paymentType, decimal unitPrice)
    {
        Id = Guid.NewGuid();
        AccountId = accountId;
        CustomerId = customerId;
        ProductId = productId;
        PaymentType = paymentType;
        UnitPrice = unitPrice;
        Amount = unitPrice;
        Status = paymentType == SalePaymentType.Cash ? SaleStatus.Paid : SaleStatus.Pending;
        PaidAtUtc = Status == SaleStatus.Paid ? DateTime.UtcNow : null;
        SoldAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid AccountId { get; private set; }
    public Guid CustomerId { get; private set; }
    public Customer? Customer { get; private set; }
    public Guid ProductId { get; private set; }
    public Product? Product { get; private set; }
    public SalePaymentType PaymentType { get; private set; }
    public decimal Amount { get; private set; }
    public decimal? UnitPrice { get; private set; }
    public decimal? DownPaymentAmount { get; private set; }
    public int? InstallmentCount { get; private set; }
    public decimal? InstallmentAmount { get; private set; }
    public decimal? LastInstallmentAmount { get; private set; }
    public DateTime? DueDate { get; private set; }
    public SaleStatus Status { get; private set; }
    public DateTime SoldAtUtc { get; private set; }
    public DateTime? PaidAtUtc { get; private set; }
    public ICollection<SaleInstallmentPayment> InstallmentPayments { get; } = new List<SaleInstallmentPayment>();

    public int ScheduledInstallmentCount => PaymentType == SalePaymentType.Installment ? InstallmentCount ?? 1 : 0;
    public int PaidInstallmentCount => Status == SaleStatus.Paid ? ScheduledInstallmentCount : InstallmentPayments.Count;
    public decimal ReceivedAmount => Status == SaleStatus.Paid
        ? Amount
        : (DownPaymentAmount ?? 0) + InstallmentPayments.Sum(payment => payment.Amount);

    public static Sale CreateCash(Guid accountId, Guid customerId, Guid productId, decimal unitPrice)
        => new(accountId, customerId, productId, SalePaymentType.Cash, unitPrice);

    public static Sale CreateInstallment(Guid accountId, Guid customerId, Guid productId, decimal unitPrice,
        decimal downPaymentAmount, int installmentCount, decimal installmentAmount, decimal? lastInstallmentAmount, DateTime? dueDate)
        => new(accountId, customerId, productId, SalePaymentType.Installment, unitPrice)
        {
            Amount = downPaymentAmount + installmentAmount * (installmentCount - 1) + (lastInstallmentAmount ?? installmentAmount),
            DownPaymentAmount = downPaymentAmount,
            InstallmentCount = installmentCount,
            InstallmentAmount = installmentAmount,
            LastInstallmentAmount = lastInstallmentAmount,
            DueDate = dueDate is { } date ? DateTime.SpecifyKind(date.Date, DateTimeKind.Unspecified) : null
        };

    public decimal GetInstallmentAmount(int number)
    {
        var amount = InstallmentAmount ?? Amount - (DownPaymentAmount ?? 0);
        return number == ScheduledInstallmentCount ? LastInstallmentAmount ?? amount : amount;
    }

    public DateOnly? GetInstallmentDueDate(int number)
    {
        if (DueDate is not { } firstDueDate) return null;
        var months = number - 1;
        var monthsUntilMaxDate = (DateTime.MaxValue.Year - firstDueDate.Year) * 12 + 12 - firstDueDate.Month;
        return months <= monthsUntilMaxDate ? DateOnly.FromDateTime(firstDueDate.AddMonths(months)) : null;
    }

    public SaleInstallmentPayment? PayInstallment(int number, Guid userId, string userName, DateTime paidAtUtc)
    {
        if (number < 1 || number > ScheduledInstallmentCount)
            throw new ArgumentOutOfRangeException(nameof(number));

        if (Status == SaleStatus.Paid || InstallmentPayments.Any(payment => payment.Number == number)) return null;

        var payment = new SaleInstallmentPayment(Id, number, GetInstallmentAmount(number), userId, userName, paidAtUtc);
        InstallmentPayments.Add(payment);
        if (InstallmentPayments.Count == ScheduledInstallmentCount)
        {
            Status = SaleStatus.Paid;
            PaidAtUtc = paidAtUtc;
        }
        return payment;
    }
}
