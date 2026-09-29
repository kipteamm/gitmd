## Installation

```shell
git clone https://github.com/kipteamm/gitmd

npm i

python -m venv venv
source venv/bin/activate

pip install -r requirements.txt
python -m flask db upgrade
exit
```


## Run the project

You can now run the program by running
```shell
source venv/bin/activate

python app.py
```

```
gitmd
├─ app
│  ├─ api.py
│  ├─ config.py
│  ├─ database.py
│  ├─ forms.py
│  └─ pages.py
├─ instance
├─ migrations
│  ├─ alembic.ini
│  ├─ env.py
│  ├─ README
│  ├─ script.py.mako
│  └─ versions
│     └─ d56d249b1b61_initial.py
├─ package-lock.json
├─ package.json
├─ pages
│  └─ the pages dir is read from and seen as documentation root (this can be changed for the purpose of the project)
├─ README.md
├─ src
│  ├─ css
│  │  ├─ base.css
│  │  ├─ index.css
│  │  ├─ tuyauxMd.css
│  │  └─ util.css
│  └─ ts
│     ├─ editor.ts
│     ├─ files.ts
│     ├─ fileTreeManager.ts
│     ├─ index.ts
│     ├─ pagesApi.ts
│     └─ renderer.ts
├─ static
│  └─ dist
│     ├─ .vite
│     │  └─ manifest.json
│     ├─ assets
│     │  └─ ...
│     └─ ...
├─ templates
│  ├─ icons
│  │  ├─ lock.html
│  │  ├─ marker.html
│  │  └─ menu.html
│  ├─ index.html
│  ├─ login.html
│  ├─ setup.html
│  └─ utils
│     └─ render_pages.html
├─ tsconfig.json
├─ vite.config.ts
└─ wsgi.py

```