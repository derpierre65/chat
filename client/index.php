<!DOCTYPE HTML>
<html>
<head>
	<link rel="stylesheet" type="text/css" href="bootstrap.min.css?v=<?php echo filemtime('bootstrap.min.css'); ?>" />
	<style>
		.online {
			color: green;
		}

		.offline {
			color: red;
		}

		* {
			font-family: "Source Code Pro", sans-serif;
		}

		#status-info {
			margin: auto;
			width: 100%;
			text-align: center;
		}

		#chat-area {
			display: flex;
			width: 100%;
			height: 350px;
			margin: 0 10px 30px 0;
		}

		#content {
			margin: 0 10px 20px 0;
			width: 100%;
			height: 100%;
			border-radius: 5px;
			border: 1px solid grey;
			color: #555555;
			padding: 8px;
			box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
			overflow-y: auto;
			word-wrap: break-word;
		}

		#users-online {
			width: 200px;
			height: 100%;
			border: 1px solid grey;
			box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
			padding: 8px;
			border-radius: 5px;
		}

		#users-online ul {
			padding-left: 15px;
			margin-top: 0;
		}

		#bb-flex {
			display: flex;
			width: 100%;
			margin-bottom: 5px;
		}

		.bb-button {
			width: 100%;
			padding: 5px;
			margin: 0 5px;
			background: lightgrey;
			text-align: center;
			border: 1px solid grey;
			border-radius: 5px;
			box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
		}

		.bb-button:hover {
			cursor: pointer;
			background: #9c9c9c;
		}

		#box {
			width: 100%;
			border: none;
			border-radius: 2px;
			color: #787878;
			padding: 10px;
			border-bottom: solid 2px #c9c9c9;
			box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
			transition: border 0.3s;
			resize: vertical;
			box-sizing: border-box;
		}

		#box:focus {
			border-bottom: solid 2px #782235;
		}

		@media only screen and (max-width: 856px) {
		}
	</style>
</head>
<!--<body onmouseover="changeStatus(true);" onmouseout="changeStatus(false);">-->
<body>
<div id="status-info">
	Server Status: <span id="status" class="online">Online</span><br>
</div>
<div id="master-wrapper">
	<div id="chat-area">
		<div id="content"></div>
		<div id="users-online"></div>
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