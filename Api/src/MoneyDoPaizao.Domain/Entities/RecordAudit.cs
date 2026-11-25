using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Domain.Entities;

public sealed record RecordAudit(
    Guid Id,
    Guid AccountId,
    ProductModule Module,
    RecordKind Kind,
    Guid RecordId,
    string RecordName,
    Guid UserId,
    string UserName,
    DateTime OccurredAtUtc,
    string Action,
    string Changes);
