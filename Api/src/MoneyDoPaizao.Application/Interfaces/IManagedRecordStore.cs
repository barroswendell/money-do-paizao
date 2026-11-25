using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Application.Interfaces;

public interface IManagedRecordStore
{
    Task<T?> ChangeAsync<T>(Guid accountId, ProductModule module, Guid id, Func<T, Task> change, CancellationToken cancellationToken)
        where T : class, IManagedRecord;

    Task<bool> DeactivateAsync(Guid accountId, ProductModule module, RecordKind kind, Guid id, CancellationToken cancellationToken);

    Task<IReadOnlyList<RecordAudit>> GetHistoryAsync(Guid accountId, ProductModule module, RecordKind? kind, Guid? recordId,
        int offset, int limit, CancellationToken cancellationToken);
}

public sealed record AuditActor(Guid Id, string Name);

public interface IAuditActor
{
    AuditActor? Current { get; }
}
