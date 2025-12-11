{
  outputs = { self, nixpkgs, ags }: let
    system = "x86_64-linux";
    pkgs = nixpkgs.legacyPackages.${system};

    astalPackages = with ags.packages.${system}; [
      astal4
      battery
      hyprland
      notifd
      tray
    ];

    extraPackages = astalPackages ++ [];
  in {
    packages.${system}.default = pkgs.stdenv.mkDerivation {
      name = "ags-shell";
      src = ./.;

      nativeBuildInputs = with pkgs; [
        wrapGAppsHook3
        gobject-introspection
        ags.packages.${system}.default
      ];

      buildInputs = extraPackages ++ [pkgs.gjs];

      installPhase = "ags bundle app.ts $out/bin/ags-shell";
    };
  };

  inputs = {
    ags.url = "github:aylur/ags";
    nixpkgs.follows = "ags/nixpkgs";
  };
}
