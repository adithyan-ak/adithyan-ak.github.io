var Typer = {
  text: '',
  accessCountimer: null,
  index: 0,
  speed: 2,
  file: '',
  accessCount: 0,
  deniedCount: 0,
  init: function () {
    accessCountimer = setInterval(function () {
      Typer.updLstChr();
    }, 500);
    $.get(Typer.file, function (data) {
      Typer.text = data;
      Typer.text = Typer.text.slice(0, Typer.text.length - 1);
    });
  },

  content: function () {
    return $('#console').html();
  },

  write: function (str) {
    $('#console').append(str);
    return false;
  },

  addText: function (key) {
    if (key.keyCode == 18) {
      Typer.accessCount++;

      if (Typer.accessCount >= 3) {
        Typer.makeAccess();
      }
    } else if (key.keyCode == 20) {
      Typer.deniedCount++;

      if (Typer.deniedCount >= 3) {
        Typer.makeDenied();
      }
    } else if (key.keyCode == 27) {
      Typer.hidepop();
    } else if (Typer.text) {
      var cont = Typer.content();
      if (cont.substring(cont.length - 1, cont.length) == '|')
        $('#console').html(
          $('#console')
            .html()
            .substring(0, cont.length - 1),
        );
      if (key.keyCode != 8) {
        Typer.index += Typer.speed;
      } else {
        if (Typer.index > 0) Typer.index -= Typer.speed;
      }
      var text = Typer.text.substring(0, Typer.index);
      var rtn = new RegExp('\n', 'g');

      $('#console').html(text.replace(rtn, '<br/>'));
      window.scrollBy(0, 50);
    }

    if (key.preventDefault && key.keyCode != 122) {
      key.preventDefault();
    }

    if (key.keyCode != 122) {
      // otherway prevent keys default behavior
      key.returnValue = false;
    }
  },

  updLstChr: function () {
    var cont = this.content();

    if (cont.substring(cont.length - 1, cont.length) == '|')
      $('#console').html(
        $('#console')
          .html()
          .substring(0, cont.length - 1),
      );
    else this.write('|'); // else write it
  },
};

function replaceUrls(text) {
  var http = text.indexOf('http://');
  var space = text.indexOf('.me ', http);

  if (space != -1) {
    var url = text.slice(http, space - 1);
    return text.replace(url, '<a href="' + url + '">' + url + '</a>');
  } else {
    return text;
  }
}

Typer.speed = 3;
Typer.file = 'script.txt';
Typer.init();

var timer = setInterval('t();', 30);
function t() {
  Typer.addText({ keyCode: 123748 });

  if (Typer.index > Typer.text.length) {
    clearInterval(timer);
  }
}

const pgpkey = `
-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: OpenPGP.js v4.10.10
Comment: https://openpgpjs.org

xsBNBGAlSpgBCAChfzxgoWKtIY8S3wyxN6UwPGIBzD9tLGEuvWkVISgGD9Lk
qMv/WbwNa/UbHkazIa/2Cl6Jvf1BxL3nqqpsANFGoOiqX0gV5QUV/aVhH7Dw
xpMQGrXgSIHPwou8rKISVSKEt44On8rM3L5NSt8N0OBFI6pYv2YgetSJLltu
omkBQ3/N0c3j9HvzlFfOTF0jRs0Rwjuzb0rqq8rObJKZTifskad4GyC33Hgj
x30KfTSKG9D7Gn1jYL7W+40mw7JHCII94RlDv251dJmJg8fYbjDUBCwMpAig
LVQ+K/PqWLEtDLuDmY358OqXYYxJS286bkWSIs96Ks7kaqZeGg9JOe2JABEB
AAHNKWFrcnRAcHJvdG9ubWFpbC5jb20gPGFrcnRAcHJvdG9ubWFpbC5jb20+
wsCNBBABCAAgBQJgJUqYBgsJBwgDAgQVCAoCBBYCAQACGQECGwMCHgEAIQkQ
DqbUhQz8bmEWIQQ3FIXlE1wer08Gvo8OptSFDPxuYSEFCACIay7vK/jZb2Tx
Z+R00Myx3tYrSilO5rEzE5kiYxPBJupK81sncsBxf3uJaPrUoe3HuLOQ/lBB
yi4HHzDdLol8Fi76C9T1PdRqbIVx92Jzwo8HDNUxb9LPz9H7grss4ZSrDs/6
plghhzsoi+W8/wk+0hmrk+Uh6+89zAsWCKLh3W3WQc7TSJgrCBhfFbV0Gz2X
cT2ZhDRtCOvfJjbVJDEb+UMmN0WxLPaMHQBnSF9SQ6RRgN8QpGA2N1KWCe+F
jSEs1GFFWXZ+4dqi0NRzoUEOd2YjI+I6lW9cLWRtxXSBQR/ZcKy2pIGhMrB5
IYTVRxr3/tsQWeJOJVYG//5cbk9izsBNBGAlSpgBCADBfJQsZldC4HV8CT/f
jF9Y62j7JQJ8PJyVAMQc4El5lRS6o3yG1cl7JUnu83e45qt3ICNRwNifd3no
+3m4Xx522g0VRCM9ZZfxETxNJoPD2Zgo4Lt8//c4szgi2gkNMrDbtiWdApBw
wLtb9dhdeX46+fDnF0EiJ3d8ZaFpKzH5h5CM2lweBlL3GU1dmnXrTpa3OVAp
4Cc1grWEGENzbLOHo3Jdm/+Pe/nsNUcf55EmIgkgjAG/kLxwIDaO0DeuL1Es
+yF8m1D+VxGECga733i9A+O4zkLEXbqDiQsCrbgzykZNn6+Z3rIdqzQV4h1k
xnka9PoOGB9yoiTu5VwgnkZvABEBAAHCwHYEGAEIAAkFAmAlSpgCGwwAIQkQ
DqbUhQz8bmEWIQQ3FIXlE1wer08Gvo8OptSFDPxuYTDNB/9Vy8UARrN2h6sP
mT46t2NHxMWE+W1P5+mD/dqz4ivp2eEgJ7UNt+9R9l4HCIehembkZKHREK90
kqEohaRdKmP5V3rDub3lpx1GWebMBsBjXpXjm+u/KVfvdNEzirXLOOFNVx/M
7lotT1H8iRCtNCuNLIOYgsdoS0Cca25hLABa9JG3nZnVD39S/pZ4ZdYgL0tR
aikMlAvoiDfkAcWjb4zS41sjyzcRJH3ZOTiyEmcEcWBv0wuDrwZS584ICYTI
hKTBs4slmCrOl3e9SF4087MwDqi4bezlML0uH1K1nx+tQi79AuaxtfNFkN+c
VtfdAxycRrq+3ky6PqfWBluURMmx
=TCOy
-----END PGP PUBLIC KEY BLOCK-----
`;

const pgpk = "<pre>"+pgpkey+"</pre>";