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
      name = "astal-shell";
      src = ./.;

      nativeBuildInputs = with pkgs; [
        wrapGAppsHook
        gobject-introspection
        ags.packages.${system}.default
      ];

      buildInputs = extraPackages ++ [pkgs.gjs];

      installPhase = ''
        runHook preInstall

        mkdir -p $out/bin
        mkdir -p $out/share
        cp -r * $out/share
        ags bundle app.tsx $out/bin/astal-shell -d "SRC='$out/share'"

        runHook postInstall
      '';
    };
  };

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    ags = { url = "github:aylur/ags"; inputs.nixpkgs.follows = "nixpkgs"; };
  };
}
