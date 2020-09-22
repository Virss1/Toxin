import 'item-quantity-dropdown/lib/item-quantity-dropdown.min';
import 'item-quantity-dropdown/lib/item-quantity-dropdown.min.css';


let lastOpenedDropdown;

// Функция закрытия/открытия дропдауна
const toggleDropDown = (event) => {
  const target = event.target;
  const $openedDropdowns = $('.iqdropdown.menu-open');
  const currentDropdown = target.closest('.iqdropdown');
  const dropdownMenu = target.closest('.iqdropdown-menu');
  const dropdownControls = target.closest('.iqdropdown__controls');
  const applyButton = target.closest('.button_link:not(.button_link_clear)');
  const clearButton = target.closest('.button_link.button_link_clear');

  const closeNotAlwaysOpenedDropdowns = () => {
    $openedDropdowns.each(function() {
      if (!$(this).data('always-opened')) {
        $(this).removeClass('menu-open');
      }
    })
  };

  const setAllIQDropdownsZIndexTo1 = () => {
    $('.iqdropdown').css('z-index', 1);
  };

  const isDropdownPressed = currentDropdown && !dropdownMenu && !dropdownControls;
  const isClickedOutsideOfDropdownOrOnApply =
        !currentDropdown && !clearButton || applyButton;

  if (isDropdownPressed) {
    closeNotAlwaysOpenedDropdowns();
    $(currentDropdown).addClass('menu-open');
    setAllIQDropdownsZIndexTo1();
    currentDropdown.style.zIndex = '99';
    lastOpenedDropdown = currentDropdown;
  } else if (isClickedOutsideOfDropdownOrOnApply) {
    closeNotAlwaysOpenedDropdowns();
    setAllIQDropdownsZIndexTo1();
    // TODO: add new function to restore previous menu html & reinit dropdown
    if (!applyButton) {
      console.log(lastOpenedDropdown.id);
      $('.iqdropdown-menu', lastOpenedDropdown).html(iqdMenusHTMLs[lastOpenedDropdown.id]);
      iqDropdownInit(lastOpenedDropdown);
    }
  }
};

const dropdownsItemsCounts = {};

function setSelectionText(dropdown, itemsCount, totalItems) {
  const $selectionText = $('.iqdropdown-selection', dropdown);
  if (totalItems === 0) {
    $selectionText.text($(dropdown).data('placeholder'));
    return;
  }

  let selectionText = '';

  function chooseDeclension(optionId, itemsCount) {
    const totalItemsLastDigit = parseInt(
      itemsCount.toString()
        .split('')
        .pop()
    );

    const $option = $(`#${dropdown.id} .iqdropdown-menu-option[data-id="${optionId}"`);
    let declensionText = $option.data('name'); // Если нет списка склонений, используется название элемента
    if ($option.data('declensions')) { // Если есть список склонений, выбрать нужное
      const declensionsList = $option.data('declensions');
      declensionText = declensionsList[2]; //5+
      const isTotalItemsEndsWith2to4 = [2, 3, 4].indexOf(totalItemsLastDigit) != -1;
      if (isTotalItemsEndsWith2to4 && (itemsCount < 12 || itemsCount > 21)) {
        declensionText = declensionsList[1]; //2-4
      } else if (itemsCount === 1 || (totalItemsLastDigit === 1 && itemsCount > 20)) {
        declensionText = declensionsList[0]; //1
      }
    }
    return declensionText;
  }
    
  if ($(dropdown).hasClass('dropdown_guests')) {
    // Если это выбор кол-ва гостей
    if (itemsCount.item3 > 0) {
      // Если выбраны младенцы
      const text = chooseDeclension('item1', totalItems - itemsCount.item3);
      const textInfants = chooseDeclension('item3', itemsCount.item3);
      selectionText = `${totalItems - itemsCount.item3} ${text}, ${itemsCount.item3} ${textInfants}`;
      $selectionText.text(selectionText);
    } else {
      // Если нет младенцев
      selectionText = `${totalItems} ${chooseDeclension('item1', totalItems)}`;
      $selectionText.text(selectionText);
    }
  } else {
    // если выбор удобств
    for (let i = 1; i <= Object.keys(itemsCount).length; i++) {
      if (itemsCount[`item${i}`] > 0) {
        if (selectionText !== '') selectionText += ', ';
        selectionText +=
          `${itemsCount[`item${i}`]} ${chooseDeclension(`item${i}`, itemsCount[`item${i}`])}`;
      }
    }
    
    $selectionText.text(selectionText);
  }

  dropdownsItemsCounts[dropdown.id].selectionText = selectionText;
}

const iqDropdownInit = (dropdown) => {
  $(dropdown).iqDropdown({
    setSelectionText(itemsCount, totalItems) {
      dropdownsItemsCounts[dropdown.id] = {
        itemsCount,
        totalItems,
      }
      // проверка на класс dropdown_amenities, т. к. у dropdown этого типа нет блока кнопок 
      if ($(dropdown).hasClass('dropdown_amenities')) {
        setSelectionText(dropdown, itemsCount, totalItems);
      } else {
        return dropdownsItemsCounts[dropdown.id].selectionText;
      }
    },
    onChange: (id, count, totalItems) => {
      const $buttonIncrement = $(`#${dropdown.id} [data-id='${id}'] .button-increment`);
      const $buttonDecrement = $(`#${dropdown.id} [data-id='${id}'] .button-decrement`);
      const maxCount = $(`#${dropdown.id} [data-id='${id}']`).data('maxcount');
      if (count === maxCount) {
        $buttonIncrement.prop('disabled', true);
        $buttonIncrement.addClass('button-increment_disabled');
      } else if (count === 0) {
        $buttonDecrement.prop('disabled', true);
        $buttonDecrement.addClass('button-decrement_disabled');
      } else {
        [$buttonIncrement, $buttonDecrement].forEach((button) => {
          button.removeAttr('disabled');
        });
        $buttonIncrement.removeClass('button-increment_disabled');
        $buttonDecrement.removeClass('button-decrement_disabled');
      }

      // Отображение/скрытие кнопки очистить
      const $clearButton = $(`#${dropdown.id} .iqdropdown__button.button_link_clear`);
      totalItems > 0
        ? $clearButton.removeClass('button_link_clear_hidden')
        : $clearButton.addClass('button_link_clear_hidden');
    },
  });
  
  const $options = $('.iqdropdown-menu-option', dropdown);
  for (let option of $options) { // disable '-' if item's count is 0
    if (option.dataset.defaultcount === '0') {
      const $decrementButton = $('.button-decrement', option);
      $decrementButton.prop('disabled', true);
      $decrementButton.addClass('button-decrement_disabled');
    }
  }
  $(`#${dropdown.id} .icon-decrement`).text('-');
  $(`#${dropdown.id} .icon-increment`).text('+');

  // удаление события клика по дропдауну
  $(dropdown).off('click');

  // Если есть блок с кнопками "очистить" и "применить", создать обработчики нажатий
  if ($(`#${dropdown.id} .iqdropdown__controls`).length > 0) {
    $(`#${dropdown.id} .button_link_clear`).on('click', clearFn);
    $('.button_link:not(.button_link_clear)', dropdown).on('click', () => {
      setSelectionText(
        dropdown,
        dropdownsItemsCounts[dropdown.id].itemsCount,
        dropdownsItemsCounts[dropdown.id].totalItems,
      );
      // TODO: save current dropdown's menu's html to object
      iqdMenusHTMLs[dropdown.id] = $('.iqdropdown-menu', dropdown).html();
    });
  }
}


// Инициализация dropdown'ов после загрузки страницы
$(function() {
  $('.iqdropdown').each(function() {
    iqDropdownInit(this);
    setSelectionText(
      this,
      dropdownsItemsCounts[this.id].itemsCount,
      dropdownsItemsCounts[this.id].totalItems,
    );
  });
});

// Сохранение всех списков в один объект
const $iqdMenus = $('.iqdropdown-menu');
const iqdMenusHTMLs = {};
for (let iqdMenu of $iqdMenus) {
  let id = iqdMenu.parentNode.id;
  iqdMenusHTMLs[id] = ($(iqdMenu).html());
}

// Функция очистки iqDropdown
const clearFn = (event) => {
  const target = event.target;
  const dropdownMenu = target.closest('.iqdropdown-menu');
  const dropdown = target.closest('.iqdropdown');
  const resetedHTML = $.parseHTML(iqdMenusHTMLs[dropdown.id]);
  for (let item of resetedHTML) {
    if ($(item).hasClass('iqdropdown-menu-option')) {
      $(item).attr('data-defaultcount', '0');
    }
  }
  $(dropdownMenu).html(resetedHTML);
  $('.button_link_clear', dropdown).addClass('button_link_clear_hidden');
  iqDropdownInit(dropdown);
  setSelectionText(dropdown, 0, 0);
};

// Проверка на нажатие внутри/вне дропдауна и закрытие его
$(document).on('click', toggleDropDown);
