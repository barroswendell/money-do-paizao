using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Infrastructure.Persistence;

public static class DatabaseSeeder
{
    public static async Task InitializeAsync(
        IServiceProvider services,
        IConfiguration configuration,
        CancellationToken cancellationToken = default)
    {
        var context = services.GetRequiredService<MoneyDoPaizaoDbContext>();
        await context.Database.EnsureCreatedAsync(cancellationToken);

        var email = configuration["AdminSeed:Email"] ?? "admin@moneydopaizao.local";
        if (await context.Users.AnyAsync(item => item.Email == email, cancellationToken))
        {
            return;
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
    }
}
