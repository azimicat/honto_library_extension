# honto_library_extension
hontoのウィッシュリスト（https://honto.jp/my/wishlist.html）の本が、指定の図書館に存在するかどうかを確認するGoogle Chrome拡張機能。

hontoにログインした状態で、ウィッシュリスト画面を開き拡張機能をONにすると
`class="stContents"`内部に図書館蔵書有無の表示が出るようになる。
リンクになっており、クリックすると対象図書館の対象図書の画面に遷移する。

図書館の指定は、オプションページから行う。都道府県->市町村->図書館名で選択ができる。
蔵書情報は"https://calil.jp/doc/api.html"から取得する。
