namespace MoneyDoPaizao.Domain.Entities;

public sealed class PartyEvent
{
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
        string? notes)
    {
        Id = Guid.NewGuid();
        AccountId = accountId;
        CustomerId = customerId;
        ThemeId = themeId;
        EventDate = eventDate.Date;
        TotalAmount = totalAmount;
        DepositReceived = depositReceived;
        DepositAmount = depositReceived ? depositAmount : 0;
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
        string? notes) => new(accountId, customerId, themeId, eventDate, totalAmount, depositReceived, depositAmount, notes);
}
