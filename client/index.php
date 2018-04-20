<!DOCTYPE HTML>
<html>
<head>
	<link rel="stylesheet" type="text/css" href="bootstrap.min.css?v=<?php echo filemtime('bootstrap.min.css'); ?>" />
	<link rel="stylesheet" type="text/css" href="chat.css?v=<?php echo filemtime('chat.css'); ?>" />
</head>
<!--<body onmouseover="changeStatus(true);" onmouseout="changeStatus(false);">-->
<body>
<div id="master-wrapper">
	<div id="chat-area">
		<div id="content"></div>
		<div id="users-online"></div>
	</div>
    <div id="status-info">
        Server Status: <span id="status" class="offline">Offline</span><br>
    </div>
	<div id="bb-flex">
		<div class="bb-button" id="bb-bold">Bold</div>
		<div class="bb-button" id="bb-italic">Italic</div>
		<div class="bb-button" id="bb-under">Under</div>
		<div class="bb-button" id="bb-crossed">Crossed</div>
		<div class="bb-button" id="bb-img">IMG</div>
		<div class="bb-button" id="bb-url">URL</div>
		<div class="bb-button" id="bb-video">Video</div>
	</div>
	<textarea id="box" placeholder="Nachricht"></textarea>
</div>


<div class="modal" tabindex="-1" role="dialog">
	<div class="modal-dialog" role="document">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title"></h5>
				<button type="button" class="close" data-dismiss="modal" aria-label="Close">
					<span aria-hidden="true">&times;</span>
				</button>
			</div>
			<div class="modal-body">

			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-primary btn-paste">Einfügen</button>
			</div>
		</div>
	</div>
</div>

<script src="jquery-3.2.1.min.js"></script>
<script src="socket.io.js"></script>
<script src="bootstrap.min.js?v=<?php echo filemtime('bootstrap.min.js'); ?>"></script>
<script src="chat.js?v=<?php echo filemtime('chat.js'); ?>"></script>
</body>
</html>