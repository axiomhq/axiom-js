let pkgs = import <nixpkgs> {};
in pkgs.mkShell {
  nativeBuildInputs = (with pkgs; [ 
    nodejs
  ]);
}
