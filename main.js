var local = false;
var files = [];
var percent = 50;
var share_url_prefix = '/view/';
if (local) {
	share_url_prefix = '?id=';
}
var human_errors = {
	'upload': 'General upload error',
	'spam': 'Too much requests in a short period of time. Try again later.',
	'size': 'Your files are too big.',
	'filetype': 'Only JPG and PNG files allowed.',
	'filetype_match': 'Only JPG and PNG files allowed.'
}
var loading_timeout;
var embed_height = 400;
var embed_code = '';

var $content = $('.content');

var $upload = $('.upload');
var $box = $upload.find('.box');
var $first = $upload.find('.first');
var $second = $upload.find('.second');

var $revision = $('.revision');
var $before = $revision.find('.before');
var $after = $revision.find('.after');
var $line = $revision.find('.line');
var $image = $('.image');
var $form = $('#form');
var $loading = $('.loading');
var $buttons = $('.buttons');
var $copy = $buttons.find('.copy');
var $embed = $buttons.find('.embed');
var $footer = $('footer');

$box.on('dragenter', function(e) {
	e.stopPropagation();
	e.preventDefault();
	if (!$(this).hasClass('drop')) {
		$(this).addClass('highlight');
	}
});

$box.on('dragover', function(e) {
	e.stopPropagation();
	e.preventDefault();
})

$box.on('dragleave', function(e) {
	e.stopPropagation();
	e.preventDefault();
	if (!$(this).hasClass('drop')) {
		$(this).removeClass('highlight');
	}
});

$box.on('drop', function(e) {
	e.preventDefault();
	if (e.originalEvent.dataTransfer.files.length == 0) {
		$(this).removeClass('highlight');
		return false;
	}
	if (!checkFiletype(e.originalEvent.dataTransfer.files)) {
		alert('Only png and jpg files allowed.');
		return false;
	}
	if (e.originalEvent.dataTransfer.files.length == 1) {
		files.push(e.originalEvent.dataTransfer.files[0]);
	} else if (e.originalEvent.dataTransfer.files.length == 2 && files.length == 0) {
		files.push(e.originalEvent.dataTransfer.files[0]);
		files.push(e.originalEvent.dataTransfer.files[1]);
		$box.addClass('drop').removeClass('highlight');
	} else {
		alert('Too much files');
		return false;
	}
	if (files.length == 2) {
		submit(true);
	}
	$(this).addClass('drop').removeClass('highlight');
});

$box.on('click', function() {
	if (files.length == 0) {
		$form.find('input[name=before]').trigger('click');
	} else if (files.length == 1) {
		$form.find('input[name=after]').trigger('click');
	}
});

$form.find('input').on('change', function() {
	var $el = $(this);
	if($el.get(0).files.length == 1) {
		files.push($el.get(0).files[0]);
		if ($el.attr('name') == 'before') {
			$first.addClass('drop');
		} else {
			$second.addClass('drop');
		}
	}
	if (files.length == 2) {
		submit(false);
	}
});

function submit(fromDragAndDrop) {
	var ajaxData = new FormData($form.get(0));
	if (fromDragAndDrop) {
		ajaxData.append('before', files[0]);
		ajaxData.append('after', files[1]);
	}
	$.ajax({
		url: 'upload.php',
		type: 'POST',
		data: ajaxData,
		dataType: 'json',
		cache: false,
		contentType: false,
		processData: false,
		success: function(data) {
			loadImages(data.before, data.after);
			history.pushState(data, $('title').html(), share_url_prefix + data.id);
		},
		error: function(data) {
			clearTimeout(loading_timeout);
			files = [];
			$box.removeClass('drop');
			$loading.hide();
			$upload.show();
			$('.info').show();
			$content.addClass('with-upload');
			alert(human_errors[data.responseJSON.error]);
			console.error(data);
		}
	});
	loading_timeout = setTimeout(function() {
		$upload.hide();
		$('.info').hide();
		$content.removeClass('with-upload');
		$loading.show();
	}, 300);
}

function loadImages(before, after) {
	$after.on('load', function() {
		setTimeout(function() { 
			$loading.hide();
			$revision.show();
			$buttons.show();
			$footer.removeClass('with-upload');
			generateEmbedCode();
			responsiveImage();
		}, 300);
		$before.css('clip-path', 'inset(0 ' + percent +'% 0 0)').css('-webkit-clip-path', 'inset(0 ' + percent +'% 0 0)');
	});
	$before.attr('src', before);
	$after.attr('src', after);
}

function checkFiletype(filesArray) {
	for (var  i = 0; i < filesArray.length; i++) {
		if (filesArray[i].type != 'image/png' && filesArray[i].type != 'image/jpeg') {
			return false;
		}
	}
	return true;
}

$line.draggable({
	containment: $('.before'),
	drag: function() {
		var sliderValue = parseInt($line.css('left')) - $image.offset().left;
		percent = 100 - (sliderValue / $after.width() * 100);
		$before.css('clip-path', 'inset(0 ' + percent +'% 0 0)').css('-webkit-clip-path', 'inset(0 ' + percent +'% 0 0)');
	}
});

function responsiveImage() {
	$image.css({
		left: '50%',
		marginLeft: $image.width() / -2
	});
	$line.css({
		left: $image.offset().left + ((100 - percent) / 100 * $image.width()),
		height: $image.height()
	});
	if ($before.attr('src') != '') {
		$content.css('height', $image.height());
	} 
}

$(window).resize(responsiveImage);

var clipboard = new Clipboard('.copy', {
    text: function() {
        return window.location.href;
    }
});

clipboard.on('success', function(e) {
    $copy.addClass('copied').html('<i class="fa fa-check" aria-hidden="true"></i> Copied!');
});

clipboard.on('error', function(e) {
	var info_text = 'Press Ctrl+C to copy!';
	if (navigator.platform.toUpperCase().indexOf('MAC') >= 0) {
		info_text = 'Press &#8984;+C to copy!';
	}
	$copy.addClass('copied').html(info_text);
});

var embed = new Clipboard('.embed', {
    text: function() {
        return embed_code;
    }
});

embed.on('success', function(e) {
    $embed.addClass('copied').html('<i class="fa fa-check" aria-hidden="true"></i> Copied!');
});

embed.on('error', function(e) {
	var info_text = 'Press Ctrl+C to copy!';
	if (navigator.platform.toUpperCase().indexOf('MAC') >= 0) {
		info_text = 'Press &#8984;+C to copy!';
	}
	$embed.addClass('copied').html(info_text);
});

function generateEmbedCode() {
	var ratio = $after.height() / $after.width();
	var embed_width = Math.round(embed_height / ratio);
	var embed_url = window.location.href.replace('view', 'embed');
	embed_code = '<iframe class="revision-embed" width="' + embed_width + '" height="' + embed_height + '" src="' + embed_url + '" frameborder="0" style="border: 2px solid rgba(0, 0, 0, 0.5); width: 100%;" scrolling="no"></iframe><script>var revisionEmbeds=document.querySelectorAll(\'.revision-embed\');function responsiveRevisionEmbeds(){for(var a=0;a<revisionEmbeds.length;a++){var b=parseInt(revisionEmbeds[a].height)/parseInt(revisionEmbeds[a].width),c=revisionEmbeds[a].getBoundingClientRect().width,d=Math.round(c*b);revisionEmbeds[a].width=c,revisionEmbeds[a].height=d}}responsiveRevisionEmbeds(),window.addEventListener(\'resize\',responsiveRevisionEmbeds);</script>';
}