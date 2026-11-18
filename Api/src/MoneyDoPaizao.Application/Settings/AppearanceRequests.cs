namespace MoneyDoPaizao.Application.Settings;

public sealed record AppearanceResponse(
    bool UseCustomTheme,
    string PrimaryColor,
    string SecondaryColor,
    bool IsDarkMode);

public sealed record UpdateAppearanceRequest(
    bool UseCustomTheme,
    string PrimaryColor,
    string SecondaryColor,
    bool IsDarkMode);
