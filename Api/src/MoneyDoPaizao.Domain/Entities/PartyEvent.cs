namespace MoneyDoPaizao.Domain.Entities;

public sealed class PartyEvent : IManagedRecord
{
    public DateTime? DeactivatedAtUtc { get; private set; }

    public void Deactivate(DateTime atUtc) => DeactivatedAtUtc ??= atUtc;

    public void AttachReferences(Customer customer, PartyTheme? theme)
    {
        CustomerId = customer.Id;
        Customer = customer;
        ThemeId = theme?.Id;
        Theme = theme;
    }

    public void UpdateDetails(DateTime eventDate, decimal totalAmount, decimal depositAmount, string? notes, decimal receivedAmount)
    {
        EventDate = DateTime.SpecifyKind(eventDate.Date, DateTimeKind.Unspecified);
        TotalAmount = totalAmount;
        DepositReceived = depositAmount > 0;
        DepositAmount = depositAmount;
        SetReceivedAmount(receivedAmount);
        Notes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim();
    }

    private PartyEvent()
    {
    }

    private PartyEvent(
        Guid accountId,
        Guid customerId,
        Guid? themeId,
        DateTime eventDate,
        decimal totalAmount,
        bool depositReceived,
        decimal depositAmount,
        string? notes,
        IReadOnlyList<PartyEventProduct> products,
        decimal receivedAmount)
    {
        Id = Guid.NewGuid();
        AccountId = accountId;
        CustomerId = customerId;
        ThemeId = themeId;
        EventDate = DateTime.SpecifyKind(eventDate.Date, DateTimeKind.Unspecified);
        TotalAmount = totalAmount;
        DepositReceived = depositReceived;
        DepositAmount = depositReceived ? depositAmount : 0;
        Products.AddRange(products);
        SetReceivedAmount(receivedAmount);
        Notes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim();
        Status = "Scheduled";
        CreatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid AccountId { get; private set; }
    public Guid CustomerId { get; private set; }
    public Customer? Customer { get; private set; }
    public Guid? ThemeId { get; private set; }
    public PartyTheme? Theme { get; private set; }
    public DateTime EventDate { get; private set; }
    public decimal TotalAmount { get; private set; }
    public bool DepositReceived { get; private set; }
    public decimal DepositAmount { get; private set; }
    public decimal AdditionalReceivedAmount { get; private set; }
    public decimal ReceivedAmount => DepositAmount + AdditionalReceivedAmount;
    public decimal RemainingAmount => TotalAmount - ReceivedAmount;
    public List<PartyEventProduct> Products { get; } = [];
    public string? Notes { get; private set; }
    public string Status { get; private set; } = "Scheduled";
    public DateTime CreatedAtUtc { get; private set; }

    public static PartyEvent Create(
        Guid accountId,
        Guid customerId,
        Guid? themeId,
        DateTime eventDate,
        decimal totalAmount,
        bool depositReceived,
        decimal depositAmount,
        string? notes,
        IReadOnlyList<PartyEventProduct> products,
        decimal receivedAmount) => new(accountId, customerId, themeId, eventDate, totalAmount, depositReceived, depositAmount, notes, products, receivedAmount);

    public void SetReceivedAmount(decimal amount) => AdditionalReceivedAmount = amount - DepositAmount;
}
