using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Infrastructure.Persistence;

public static class DatabaseSeeder
{
    public static async Task<bool> InitializeAsync(
        IServiceProvider services,
        IConfiguration configuration,
        CancellationToken cancellationToken = default)
    {
        var context = services.GetRequiredService<MoneyDoPaizaoDbContext>();
        await context.Database.EnsureCreatedAsync(cancellationToken);
        var createdApplicationTables = false;

        // O Supabase já possui tabelas internas em outros schemas. Nessa situação,
        // EnsureCreated pode entender que o banco já foi criado e não gerar as
        // tabelas do aplicativo. Verificamos uma tabela nossa especificamente.
        if (!await ApplicationTablesExistAsync(context, cancellationToken))
        {
            var createScript = context.Database.GenerateCreateScript();
            await context.Database.ExecuteSqlRawAsync(createScript, cancellationToken);
            createdApplicationTables = true;
        }

        var email = configuration["AdminSeed:Email"] ?? "admin@moneydopaizao.local";
        if (await context.Users.AnyAsync(item => item.Email == email, cancellationToken))
        {
            return createdApplicationTables;
        }

        var hasher = services.GetRequiredService<IPasswordHasher>();
        var admin = User.Create(
            configuration["AdminSeed:Name"] ?? "Administrador",
            email,
            configuration["AdminSeed:Cpf"] ?? "00000000000",
            DateTime.TryParse(configuration["AdminSeed:BirthDate"], out var birthDate)
                ? birthDate
                : new DateTime(1990, 1, 1),
            hasher.Hash(configuration["AdminSeed:Password"] ?? "Admin@123"),
            UserRole.Admin);

        await context.Users.AddAsync(admin, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
        return createdApplicationTables;
    }

    private static async Task<bool> ApplicationTablesExistAsync(
        MoneyDoPaizaoDbContext context,
        CancellationToken cancellationToken)
    {
        await context.Database.OpenConnectionAsync(cancellationToken);

        try
        {
            await using var command = context.Database.GetDbConnection().CreateCommand();
            command.CommandText = """
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                      AND table_name = 'users'
                );
                """;

            var result = await command.ExecuteScalarAsync(cancellationToken);
            return result is bool exists && exists;
        }
        finally
        {
            await context.Database.CloseConnectionAsync();
        }
    }
}
