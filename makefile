.PHONY: js
js:
	mkdir -p js
	tsc src/*.ts --module es2020 --lib es2020,dom --target es2020 --outDir js

server:
	python3 -m http.server

rawdist:
	zip -r dist.zip js
	zip -r dist.zip index.html
	zip -r dist.zip art.png


.PHONY: closure
closure:
	mkdir -p temp
	java -jar closure/closure.jar --js js/*.js --js_output_file temp/out.js --compilation_level ADVANCED_OPTIMIZATIONS --language_out ECMASCRIPT_2020
	cat closure/html_top.txt > temp/index.html
	cat temp/out.js >> temp/index.html
	cat closure/html_bottom.txt >> temp/index.html
	rm temp/out.js


.PHONY: dist
dist:
	cp art.png temp/art.png
	cp font.png temp/font.png
	(cd temp; zip -r ../dist.zip .)
	advzip -z dist.zip
	rm -rf temp


linecount:
	(cd src; find . -name '*.ts' | xargs wc -l)
