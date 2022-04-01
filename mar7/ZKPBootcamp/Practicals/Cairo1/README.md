Setting up the environment for Cairo
These instructions are for linux, for other OS see https://starknet.io/docs/quickstart.html#quickstart

Run
```
python -m venv ~/cairo_venv

source ~/cairo_venv/bin/activate

pip3 install ecdsa fastecdsa sympy


cd Practicals/Cairo1 

pip3 install cairo-lang-0.7.1.zip

code --install-extension cairo-0.7.1.vsix

```

Having setup the environment you can try compiling a test file

```
cairo-compile test.cairo --output test_compiled.json

cairo-run \
  --program=test_compiled.json --print_output \
  --print_info --relocate_prints --tracer

```
You should get a prompt to open a browser to see the Cairo tracer




