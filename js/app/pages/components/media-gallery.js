import * as templateHelper from "../../core/template_helper";
import * as alertHelper from "../../core/alert_helper";
import { getVideoCover } from "../../core/media_helper";
import MediaGalleryDataProxy from "../../data_proxy/mediaGalleryDataProxy";
import MediaGalleryService from "../../business_logic/service/mediaGalleryService";
import CategoryDataProxy from "../../data_proxy/categoryDataProxy";
import CategoryService from "../../business_logic/service/categoryService";
import { chunkArray } from "../../business_logic/shared/utils";
import { axios } from "../../infra/api";
import { applyVideoWorkaround } from "../../core/browser_workarounds";

function base64toBlob(base64Data, contentType) {
  contentType = contentType || '';
  var sliceSize = 1024;
  var byteCharacters = atob(base64Data);
  var bytesLength = byteCharacters.length;
  var slicesCount = Math.ceil(bytesLength / sliceSize);
  var byteArrays = new Array(slicesCount);

  for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
      var begin = sliceIndex * sliceSize;
      var end = Math.min(begin + sliceSize, bytesLength);

      var bytes = new Array(end - begin);
      for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
          bytes[i] = byteCharacters[offset].charCodeAt(0);
      }
      byteArrays[sliceIndex] = new Uint8Array(bytes);
  }
  return new Blob(byteArrays, { type: contentType });
}

export default class MediaGalleryComponent {
  constructor() {
    this.mediaService = new MediaGalleryService(new MediaGalleryDataProxy());
    this.categoryService = new CategoryService(new CategoryDataProxy());
  }

  async fetchMediaGallery(categoryId) {
    let command = null;

    if(categoryId) {
      command = await this.mediaService.getByCategoryIdCommand(categoryId).execute();
    } else {
      command = await this.mediaService.getAllCommand().execute();
    }

    if (command.success) {
      const data = command.value;
      if (data.success) {
        const list = data.response.data;
        this.render(list);
      }
    }
  }

  render(data) {
    const layoutClasses = [
      '',
      '',
      'tall',
      'wide',
      '',
      '',
      '',
      'tall',
      'big',
      'wide',
      'big',
      'tall',
    ];

    
    let rowMediaContentTpl = $(
      'script[data-template="media-content-template"]'
    ).text();
    var tempMediaContentHtml = "";
    var groupByChunk = chunkArray(data, layoutClasses.length);
    
    groupByChunk.forEach((data) => {
      data.forEach((media, index) => {
        var className = layoutClasses[index];

        if(media.type !== 'image') {
          className += ' playable';
        }
        
        var contentMedia = {
          className,
          imageSource: media.thumbnail_url,
          source: JSON.stringify(media),
        };

        tempMediaContentHtml += templateHelper.render(
          rowMediaContentTpl,
          contentMedia
        )
      })
    })

    $('.media-content-wrapper').html(tempMediaContentHtml);
  }
  
  async fetchCategories() {
    const command = await this.categoryService.getByTypeCommand('media').execute();

    if (command.success) {
      const data = command.value;
      if (data.success) {
        const list = data.response.data;
        this.renderCategory(list);
      }
    }
  }

  renderCategory(data) {
    let tempFilterContentHtml = "";
    let tempOptionContentHtml = '<option value="">Please choose category</option>';
    let tempListContentHtml = "";
    const itemFilterTpl = $(
      'script[data-template="media-filter-item"]'
    ).text();    
    const optionCategoryTpl = $(
      'script[data-template="media-category-option"]'
    ).text();
    const listCategoryTpl = $(
      'script[data-template="media-category-list-template"]'
    ).text();

    // default value for filter
    const defaultContent = {
      id: '',
      name: 'All',
    }
    tempFilterContentHtml += templateHelper.render(itemFilterTpl, defaultContent);
    
    data.forEach(category => {
      const content = {
        id: category.id,
        name: category.name,
        dataJson: JSON.stringify(category)
      };

      tempFilterContentHtml += templateHelper.render(itemFilterTpl, content);
      tempOptionContentHtml += templateHelper.render(optionCategoryTpl, content);
      tempListContentHtml += templateHelper.render(listCategoryTpl, content);
    });
    
    $('#media-wrapper').find('.dropdown-menu').html(tempFilterContentHtml);
    $('.form-media-wrapper').find('select[name=category_id]').each(function(){
      $(this).html(tempOptionContentHtml);
    });
    $('.media-list-category').html(tempListContentHtml);
  }
  
  handleChangeType(evt) {
    const el = evt.target;
    const value = $(el).val();
    const wrapper = $(el).closest('.form-media-wrapper');
    if(value == 'youtube') {
      wrapper.find('.file-media').hide();
      wrapper.find('.youtube-link-input').show();
      wrapper.find('.media-input-dropzone').hide();
    } else {
      wrapper.find('.file-media').show();
      wrapper.find('.youtube-link-input').hide();
      wrapper.find('.media-input-dropzone').show();
      wrapper.find('input[type=file]').prop('accept', `${value}/*`)
    }
  }

  async getValueForm(wrapper) {
    var attributes = {
      type: null,
      category_id: wrapper.find('select[name=category_id]').val(),
    }

    attributes.type = wrapper.find('input[name=type]').val()

    const modalType = wrapper.find('[name=modal_type]').val();
    
    if(attributes.type == 'youtube') {
      attributes.value = wrapper.find('input[name=youtube_link]').val();
    } else {
      if(modalType === 'camera') {
        if(attributes.type === 'image') {
          attributes.file = base64toBlob(photoRecordPlayer.recordedData.substr(photoRecordPlayer.recordedData.indexOf(',')+1), 'image/png')
        } else {
          attributes.file = videoRecordPlayer.recordedData;
        }
      } else {
        const files = wrapper.find('input[name=file]').prop('files');
        if(files.length) {
          attributes.file = files[0];
        }
      }
    }
    
    if(attributes.type == 'video') {
      const thumbnailSource = await getVideoCover(attributes.file, 1);
      attributes.thumbnail = thumbnailSource;
    }

    return attributes;
  }

  resetForm(wrapper) {
    wrapper.find('input[name=type]').val('image').trigger('change');
    wrapper.find('input[name=file]').val('').trigger('change');
    wrapper.find('input[name=file]').prop('files', null);
    wrapper.find('.preview-area').css('background-image', '');

    this.setPreviewDropZone(wrapper, null)
  }

  resetCategoryForm(wrapper) {
    wrapper.find('input[name=category_id]').val('');
    wrapper.find('input[name=category_name]').val('').trigger('change');
  }
  
  async generatePreview(el) {
    const wrapper = $(el).closest('.form-media-wrapper');
    const attributes = await this.getValueForm(wrapper);
    let imageSource = "";

    if(attributes.type == 'youtube') {
      try {
        const url = new URL(attributes.value);
        let youtubeId = attributes.value.substr(attributes.value.indexOf('?v=')+3)
        console.log("🚀 ~ file: media-gallery.js ~ line 229 ~ MediaGalleryComponent ~ generatePreview ~ youtubeId", youtubeId)
        if(url.host === 'youtu.be') {
          youtubeId = url.pathname.replace('/', '')
        }
        imageSource = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
      } catch (error) {
        console.error(error)
        imageSource = "";
      }
    } else if(attributes.type == 'image'){
      if(attributes.file) {
        imageSource = URL.createObjectURL(attributes.file);
      }
    } else if(attributes.type == 'video') {
      if(attributes.thumbnail) {
        imageSource = URL.createObjectURL(attributes.thumbnail);
      }
    }
    
    if(attributes.type === 'image' || attributes.type === 'video') {
      this.setPreviewDropZone(wrapper.find('.dropzone-container'), imageSource)
    } else {
      wrapper.find('.preview-area').css('background-image', `url(${imageSource})`)
    }
    
  }

  async handleSaveMedia(el, callback) {
    const wrapper = $(el).closest('.form-media-wrapper');
    const attributes = await this.getValueForm(wrapper);

    let loadingLabel = '<i class="fa fa-spin fa-spinner"></i> Save Changes';
    let label = loadingLabel;
    $(el).html(label);
    $(el).prop('disabled', true);

    axios.defaults.onUploadProgress = (progressEvent) => {
      const progres = Math.round( (progressEvent.loaded * 100) / progressEvent.total )

      $(el).html(`<i class="fa fa-spin fa-spinner"></i> Save Changes ${progres}%`);
    }
    
    const command = await this.mediaService.insertCommand(attributes).execute();
    if (command.success == false) {
      const firstErrorMsg = command.errors[0].message;
      alertHelper.showError(firstErrorMsg);
      label = 'Save Changes';
      
      $(el).html(label);
      $(el).prop('disabled', false);
      return;
    }
    
    if(command.success) {
      const data = command.value;
      label = 'Save Changes';
      if(data.success) {

        if(typeof callback == 'function') {
          callback();
        }

        this.resetForm(wrapper);
        alertHelper.showSnackBar('Successfully Uploaded');
      } else {
        alertHelper.showError('Upload failed');
      }
    }

    $(el).html(label);
    $(el).prop('disabled', false);
  }

  async handleSaveCategory(el, callback) {
    const wrapper = $(el).closest('.form-category-wrapper');
    const attributes = {
      type: 'media',
      name: wrapper.find('input[name=category_name]').val(),
    };
    const id = wrapper.find('input[name=category_id]').val();
    const loadingLabel = '<i class="fa fa-spin fa-spinner"></i> Save Changes';
    let label = loadingLabel;
    $(el).html(label);
    $(el).prop('disabled', true);
    let command = null;
    if(id) {
      attributes.id = id;
      command = await this.categoryService.updateCommand(attributes).execute();
    } else {
      command = await this.categoryService.insertCommand(attributes).execute();
    }
    if (command.success == false) {
      const firstErrorMsg = command.errors[0].message;
      alertHelper.showError(firstErrorMsg);
      label = 'Save Changes';
      $(el).html(label);
      $(el).prop('disabled', false);
      return;
    }
    
    if(command.success) {
      const data = command.value;
      if(data.success) {
        label = 'Save Changes';

        if(typeof callback == 'function') {
          callback();
        }

        this.resetCategoryForm(wrapper);
        alertHelper.showSnackBar('Successfully Saved');
      }
    }

    $(el).html(label);
    $(el).prop('disabled', false);
  }
  

  async handleFileDropZone(container, files) {
    if(files.length) {
      const file = files[0];
      let fileUrl = URL.createObjectURL(files[0]);
      if(file.type.includes('video')) {
        const videoEl = `
        <video controls="" style="width: 100%;height: 100%;">
          <source src="${fileUrl}">
          Your browser does not support the video tag.
        </video>
        `;

        container.find('.dropzone-area').append(videoEl);
      }

      this.setPreviewDropZone(container, fileUrl);

    } else {
      container.find('.dropzone-area').find('video').remove();
      this.setPreviewDropZone(container, '');
    }
  }

  setPreviewDropZone(container, img) {
    if(img) {
      container.find('.dropzone-action').show();
      container.find('.dropzone-info').hide();
      container.find('.dropzone-area').css('background-image', `url(${img})`);
      container.find('.dropzone-area').addClass('dropzone-disabled')
    } else {
      container.find('.dropzone-action').hide();
      container.find('.dropzone-info').show();
      container.find('.dropzone-area').css('background-image', '');
      container.find('input[type=file]').val()
      container.find('.dropzone-area').removeClass('dropzone-disabled')
    }
  }
  
  showDetail(el) {
    if($(el).is('img')) {
      el = $(el).closest('.media-content-item');
    }
    
    const source = $(el).data('source');
    const template = {
      image: 'script[data-template="media-detail-image-template"]',
      video: 'script[data-template="media-detail-video-template"]',
      youtube: 'script[data-template="media-detail-youtube-template"]'
    }
    const selectedTemplate = $(template[source.type]).text();
    const content = {
      media_id: source.id,
      source: source.value_url
    }

    const temp = templateHelper.render(
      selectedTemplate,
      content
    )
    $('#modalDetailMedia').find('.modal-body').html(temp)
    
    $('#modalDetailMedia').modal('show');
  }
  
  handleEditCategory(el) {
    const wrapper = $(el).closest('.list-group-item');
    const data = wrapper.data('category');

    $('.form-category-wrapper').find('input[name=category_id]').val(data.id);
    $('.form-category-wrapper').find('input[name=category_name]').val(data.name);
  }

  async handleDeleteCategory(el) {
    var result = await alertHelper.showConfirmation("Your category will be delete and cannot be restore");

    // - if user cancel delete
    if(!result.isConfirmed) return;

    const wrapper = $(el).closest('.list-group-item');
    const data = wrapper.data('category');

    const command = await this.categoryService.destroyCommand(data.id).execute();
    if(command.success) {
      const data = command.value;
      if(data.success) {
        $('#modalFormMedia').modal('hide');
        this.fetchCategories();
      }
    }
    
  }

  async handleDeleteMedia(el) {
    var result = await alertHelper.showConfirmation("Your media will be delete and cannot be restore");

    // - if user cancel delete
    if(!result.isConfirmed) return;

    const wrapper = $(el).closest('#modalDetailMedia');
    const mediaId = wrapper.find('input[name=media_id]').val();

    const command = await this.mediaService.destroyCommand(mediaId).execute();
    if(command.success) {
      const data = command.value;
      if(data.success) {
        $('#modalDetailMedia').modal('hide');
        this.fetchMediaGallery();
        alertHelper.showSnackBar('Successfully Deleted');
      }
    }
    
  }

  async handleShownModalCamera() {
    if(!window.photoRecordPlayer) {
      this.initiateVideoAudio('image', 'myPhoto', 'photoRecordPlayer');
    }

    if(!window.videoRecordPlayer) {
      this.initiateVideoAudio('video', 'myVideo', 'videoRecordPlayer');
    }
    
    $('.vjs-device-button').click()
  }

  initiateVideoAudio(type, videoIdEl, playerName) {
    applyVideoWorkaround();

    var options = {
      controls: true,
      bigPlayButton: false,
      width: 640,
      height: 480,
      fluid: false,
      // aspectRatio: '9:16',
      // fill: true,
      responsive: true,
      plugins: {
          record: {
              audio: true,
              video: true,
              debug: true,
              maxLength: 60 * 30, // 30 minutes
          }
      }
    };

    if(type === 'image') {
      options.plugins.record = {
        ...options.plugins.record,
        imageOutputType: 'dataURL',
        imageOutputFormat: 'image/png',
        imageOutputQuality: 0.92,
        image: {
          // image media constraints: set resolution of camera
          width: { min: 640, ideal: 640, max: 1280 },
          height: { min: 480, ideal: 480, max: 920 }
        },
      }
    }

    const player = videojs(videoIdEl, options, function() {
      // print version information at startup
      const msg = 'Using video.js ' + videojs.VERSION +
          ' with videojs-record ' + videojs.getPluginVersion('record') +
          ' and recordrtc ' + RecordRTC.version;
      videojs.log(msg);
    });
    
    // error handling
    player.on('deviceError', function() {
        console.log('device error:', player.deviceErrorCode);
    });
    
    player.on('error', function(element, error) {
        console.error(error);
    });
    
    // user clicked the record button and started recording
    player.on('startRecord', function() {
        console.log('started recording!');
    });
    
    // user completed recording and stream is available
    player.on('finishRecord', function() {
        // the blob object contains the recorded data that
        // can be downloaded by the user, stored on server etc.
        // console.log('finished recording: ', player.recordedData);
    });

    player.on('deviceReady', function() {
      player.record().enumerateDevices();
    });


    const container = $(`#${videoIdEl}`).closest('.player-container')
    window[playerName] = player;
    
    player.on('enumerateReady', function() {
      const devices = player.record().devices;
  
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
  
      if(videoDevices.length > 1) {
        const options = videoDevices.map(data => `<option value="${data.deviceId}">${data.label}</option>`).join('');
  
        container.find('.camera-device-container').show();
        if(container.find('.camera-device-container').find('select').find('option').length <= 0) {
            container.find('.camera-device-container').find('select').html(options);
            container.find('.camera-device-container').find('select').off().on('change', function(event) {
              var label = event.target.options[event.target.selectedIndex].text;
              const deviceId = event.target.value;
          
              try {
                  // change video input device
                  // if(type == 'image') {
                    window.photoRecordPlayer.record().recordImage = {deviceId: {exact: deviceId}}
                    window.photoRecordPlayer.record().stopDevice();
                    window.photoRecordPlayer.record().getDevice();
                  // } else {
                    window.videoRecordPlayer.record().setVideoInput(deviceId);
                  // }
                  $('.select-devices').prop('selectedIndex', event.target.selectedIndex)
          
                  console.log("Changed video input to '" + label + "' (deviceId: " +
                      deviceId + ")");
              } catch (error) {
                  console.warn(error);
          
                  // jump back to first output device in the list as it's the default
                  event.target.selectedIndex = 0;
              }
            })
        }
      } else {
        container.find('.camera-device-container').find('select').html('');
        container.find('.camera-device-container').hide();
      }
    });
  }
  
  initiateCategory() {
    this.fetchCategories();

    $('.form-category-wrapper .btn-save-category').on('click', (evt) => {
      this.handleSaveCategory(evt.target, () => {
        if($('#modalFormMedia').length) {
          $('#modalFormMedia').modal('hide');

        }
        this.fetchCategories();
      })
    })

    // assign event to category actions
    $('body').on('click', '.btn-edit-category', (evt) => this.handleEditCategory(evt.target));
    $('body').on('click', '.btn-delete-category', (evt) => this.handleDeleteCategory(evt.target));
  }
  
  async checkValueForEnableButton(evt) {
    const wrapper = $(evt.target).closest('.form-media-wrapper');
    const type = wrapper.find('[name=type]').val();
    const allValue = await this.getValueForm(wrapper)
    console.log("🚀 ~ file: media-gallery.js ~ line 602 ~ MediaGalleryComponent ~ checkValueForEnableButton ~ allValue", allValue)
    let isEnabled = false;

    if(type == 'youtube') {
      isEnabled = allValue.category_id && allValue.value;
    } else {
      isEnabled = allValue.category_id && allValue.file;
    }

    if(wrapper.find('input[name=modal_type]').val() === 'camera') {
      wrapper.find('.btn-save-camera').prop('disabled', !isEnabled);
    } else {
      wrapper.find('.btn-save-media').prop('disabled', !isEnabled);
    }
  }
  
  initiateFormMedia() {
    $('.form-media-wrapper').find('select[name=category_id]').on('change', function() {
      const val = $(this).val();
      if(!val) {
        $(this).addClass('is-invalid');
      } else {
        $(this).removeClass('is-invalid');
      }
    })

    $('.form-media-wrapper [name=type], .form-media-wrapper input[name=file], .form-media-wrapper input[name=youtube_link], .form-media-wrapper [name=type], .form-media-wrapper [name=category_id]').on('change keyup', (e) => this.checkValueForEnableButton(e))
    
    $('.form-media-wrapper [name=type]').on('change', this.handleChangeType)
    $('.form-media-wrapper input[name=file]').on('change', (evt) => this.generatePreview(evt.target))
    $('.form-media-wrapper input[name=youtube_link]').on('keyup change', (evt) => this.generatePreview(evt.target))
    $('.form-media-wrapper .btn-save-media').on('click', (evt) => {
      this.handleSaveMedia(evt.target, () => {
        if($('#modalFormMedia').length) {
          $('#modalFormMedia').modal('hide');

          this.fetchMediaGallery();
        }
      })
    })

    $('#modalFormMedia').on('hidden.bs.modal', function() {
      // reset field
      $(this).find('input[name=file]').val('').trigger('change');
      $(this).find('input[name=youtube_link]').val('').trigger('change');
      $(this).find('select[name=category_id]').val('').trigger('change');
    })
  }
  
  initiate() {
    const thisObject = this;
    thisObject.initiateCategory();
    thisObject.initiateFormMedia();

    $('body').on('click', '.media-content-item', (evt) => this.showDetail(evt.target))

    $('body').on('click', '#media-wrapper .filter-category', (evt) => {
      evt.preventDefault();
      // filter category
      var categoryid = $(evt.target).data('categoryid');
      this.fetchMediaGallery(categoryid);
    })
    
    this.fetchMediaGallery();
    $('body').on('click', '.btn-delete-media', (evt) => this.handleDeleteMedia(evt.target));

    $('#btnMediaImage').on('click', function() {
      $('#modalFormMedia').find('.modal-title').html('Upload Image');
      $('#modalFormMedia').find('input[name=type]').val('image').trigger('change');
    })

    $('#btnMediaVideo').on('click', function() {
      $('#modalFormMedia').find('.modal-title').html('Upload Video');
      $('#modalFormMedia').find('input[name=type]').val('video').trigger('change');
    })

    $('#btnMediaYoutube').on('click', function() {
      $('#modalFormMedia').find('.modal-title').html('Upload Youtube');
      $('#modalFormMedia').find('input[name=type]').val('youtube').trigger('change');
    })

    $('#modalFormMediaCamera').on('shown.bs.modal', (evt) => this.handleShownModalCamera(evt.target))
    $('#modalFormMediaCamera').on('hidden.bs.modal', (evt) => {
      $('#takePhoto').attr('class', 'btn btn-warning').html('<i class="fa fa-camera"></i> Take Photo')
      $('#recordVideo').attr('class', 'btn btn-warning').html('<i class="fa fa-video"></i> Record Video')

      $('#photoPlayer').find('.vjs-camera-button.vjs-icon-replay').click();
      $('#videoPlayer').find('.vjs-record-button.vjs-icon-record-stop').click();
    })

    $('#recordVideo').off().on('click', function(e) {
      $('#photoPlayer').hide();
      $('#videoPlayer').show();
      $('#modalFormMediaCamera').find('input[name=type]').val('video')

      const currentState = $(this).data('state');
      if(currentState === 'process') {
        $(this).data('state', 'idle');
        $(this).attr('class', 'btn btn-warning').html('<i class="fa fa-video"></i> Record Video')
        // videoRecordPlayer.record().stop();
        $('#videoPlayer').find('.vjs-record-button.vjs-icon-record-stop').click();
        setTimeout(() => {
          thisObject.checkValueForEnableButton(e)
        }, 100)
      } else {
        $('.btn-save-camera').prop('disabled', true);
        $(this).data('state', 'process');
        $(this).attr('class', 'btn btn-danger').html('<i class="fa fa-stop-circle"></i> Stop Record')
        // videoRecordPlayer.record().start();
        $('#videoPlayer').find('.vjs-record-button.vjs-icon-record-start').click();
      }
      
    })

    $('#takePhoto').on('click', function(e) {
      $('#photoPlayer').show();
      $('#videoPlayer').hide();
      $('#modalFormMediaCamera').find('input[name=type]').val('image')

      const currentState = $(this).data('state');
      if(currentState === 'process') {
        $('.btn-save-camera').prop('disabled', true);
        $(this).data('state', 'idle');
        $('#photoPlayer').find('.vjs-camera-button.vjs-icon-replay').click();
        $(this).attr('class', 'btn btn-warning').html('<i class="fa fa-camera"></i> Take Photo')
      } else {
        photoRecordPlayer.record().start();
        
        $(this).data('state', 'process');
        $(this).attr('class', 'btn btn-info').html('<i class="fa fa-camera"></i> Retake Photo')

        setTimeout(() => {
          thisObject.checkValueForEnableButton(e)
        }, 100)
      }
    })

    $('.form-media-wrapper .btn-save-camera').on('click', (evt) => {
      this.handleSaveMedia(evt.target, () => {
        if($('#modalFormMediaCamera').length) {
          $('#modalFormMediaCamera').modal('hide');

          this.fetchMediaGallery();
        }
      })
    })



    // handle dropzone
    $('.dropzone-area').on('click', function(e) {
      e.stopPropagation()
      if($(this).hasClass('dropzone-disabled') == false) {
        const inputFile = $(this).find('input[type=file]')
  
        inputFile.click();
      }
    })

    $('.dropzone-area input[type=file]').on('click', function(e){
      e.stopPropagation();
    })

    

    $('.dropzone-area input[type=file]').on('change', function(e){
      const files = e.target.files;
      console.log("🚀 ~ file: media-gallery.js ~ line 762 ~ MediaGalleryComponent ~ $ ~ files", files)
      const container = $(this).closest('.dropzone-container')

      thisObject.handleFileDropZone(container, files)
    })

    $('.dropzone-container .btn-cancel').on('click', function() {
      const container = $(this).closest('.dropzone-container');

      container.find('input[type=file]').val('').trigger('change');
      
      container.find('.dropzone-action').hide();
      container.find('.dropzone-info').show();
      container.find('.dropzone-area').css('background-image', '');
    })

    $('.dropzone-area').on('dragenter dragover dragleave drop', function(e) {
      e.preventDefault();
      e.stopPropagation();
    })

    $('.dropzone-area').on('dragenter dragover', function(e) {
      $(this).addClass('dropzone-hightlight');
    })

    $('.dropzone-area').on('dragleave drop', function(e) {
      $(this).removeClass('dropzone-hightlight');
    })

    $('.dropzone-area').on('drop', function(e) {
      const container = $(this).closest('.dropzone-container');
      const dt = e.originalEvent.dataTransfer;
      const files = dt.files;
      container.find('input[type=file]')[0].files = files;

      thisObject.generatePreview(e.target)
      // thisObject.async (container, files)
      // thisObject.generatePreview
    })    
  }
}