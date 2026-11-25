using Microsoft.EntityFrameworkCore;

namespace MoneyDoPaizao.Infrastructure.Persistence;

internal static class ManagedRecordsSchema
{
    public static async Task ApplyAsync(MoneyDoPaizaoDbContext context, CancellationToken cancellationToken)
    {
        const string sql = """
            ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS deactivated_at_utc timestamptz;
            ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS deactivated_at_utc timestamptz;
            ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS notes varchar(500);
            ALTER TABLE public.finance_entries ADD COLUMN IF NOT EXISTS deactivated_at_utc timestamptz;
            ALTER TABLE public.party_themes ADD COLUMN IF NOT EXISTS deactivated_at_utc timestamptz;
            ALTER TABLE public.party_products ADD COLUMN IF NOT EXISTS deactivated_at_utc timestamptz;
            ALTER TABLE public.party_events ADD COLUMN IF NOT EXISTS deactivated_at_utc timestamptz;
            ALTER TABLE public.party_event_products ADD COLUMN IF NOT EXISTS deactivated_at_utc timestamptz;
            ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deactivated_at_utc timestamptz;
            ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS deactivated_at_utc timestamptz;

            ALTER TABLE public.sale_installment_payments ADD COLUMN IF NOT EXISTS id uuid NOT NULL DEFAULT gen_random_uuid();
            CREATE UNIQUE INDEX IF NOT EXISTS ix_sale_installment_payments_id ON public.sale_installment_payments (id);

            CREATE TABLE IF NOT EXISTS public.record_audits (
                id uuid PRIMARY KEY,
                account_id uuid NOT NULL,
                module varchar(40) NOT NULL,
                kind varchar(30) NOT NULL,
                record_id uuid NOT NULL,
                record_name varchar(160) NOT NULL,
                user_id uuid NOT NULL,
                user_name varchar(160) NOT NULL,
                occurred_at_utc timestamptz NOT NULL,
                action varchar(30) NOT NULL,
                changes jsonb NOT NULL
            );
            CREATE INDEX IF NOT EXISTS ix_record_audits_module_time ON public.record_audits (account_id, module, occurred_at_utc DESC, id DESC);
            CREATE INDEX IF NOT EXISTS ix_record_audits_record_time ON public.record_audits (account_id, module, kind, record_id, occurred_at_utc DESC, id DESC);
            """;

        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        await context.Database.ExecuteSqlRawAsync(sql, cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }
}
