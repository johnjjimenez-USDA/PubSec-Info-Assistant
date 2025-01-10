// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { useState, useEffect } from 'react';
import { TagPicker, ITag, IBasePickerSuggestionsProps } from '@fluentui/react/lib/Pickers';
import {
  TooltipHost,
  ITooltipHostStyles
} from "@fluentui/react";
import { Info16Regular } from '@fluentui/react-icons';
import { mergeStyles } from '@fluentui/react/lib/Styling';
import { useId } from '@fluentui/react-hooks';
import { getAllYears } from "../../api";

import styles from "./YearPicker.module.css";

var allowAddNew = false;

interface Props {
  allowNewYears?: boolean;
  onSelectedYearsChange: (selectedYears: ITag[]) => void;
  preSelectedYears?: ITag[];
  hide?: boolean;
}

export const YearPickerInline = ({ allowNewYears, onSelectedYearsChange, preSelectedYears, hide }: Props) => {

  const pickerId = useId('year-inline-picker');
  const tooltipId = useId('yearpicker-tooltip');
  const hostStyles: Partial<ITooltipHostStyles> = { root: { display: 'inline-block' } };
  const newItem = mergeStyles({ color: '#f00', background: '#ddf', padding: '10px' });
  const existingItem = mergeStyles({ color: '#222', padding: '10px' });

  const [selectedYears, setSelectedYears] = useState<ITag[]>([]);
  const [years, setYears] = useState<ITag[]>([]);
  const getTextFromItem = (item: ITag) => item.name;

  allowAddNew = allowNewYears as boolean;

  const listContainsYearList = (year: ITag, yearList?: ITag[]): boolean => {
    if (!yearList || !yearList.length || yearList.length === 0) {
      return false;
    }
    return yearList.some((compareYear: ITag) => compareYear.key === year.key);
  };

  const filterSuggestedYears = (filterText: string, yearList: ITag[] | undefined): ITag[] => {
    var existingMatches = filterText
      ? years.filter(
        year => year.name.toLowerCase().indexOf(filterText.toLowerCase()) === 0 && !listContainsYearList(year, yearList),
      )
      : [];

    if (allowAddNew) {
      return existingMatches.some(a => a.key === filterText)
        ? existingMatches :
        [{ key: filterText, name: filterText, isNewItem: true } as ITag].concat(existingMatches);
    }
    else {
      return existingMatches;
    }
  };

  const onItemSelected = (item: any | undefined): ITag | PromiseLike<ITag> | null => {
    const selected = selectedYears;
    if (item && item.isNewItem) {
      item.isNewItem = false;
      var newYears = years;
      newYears.push(item);
      setYears(newYears);
    }
    return item as ITag;
  };

  const onRenderSuggestionsItem = (props: any, itemProps: any): JSX.Element => {
    if (allowAddNew) {
      return <div className={props.isNewItem ? newItem : existingItem} key={props.key}>
        {props.name}
      </div>;
    }
    else {
      return <div className={existingItem} key={props.key}>
        {props.name}
      </div>;
    }

  };

  const pickerSuggestionsProps: IBasePickerSuggestionsProps = {
    suggestionsHeaderText: 'Existing Years',
    noResultsFoundText: allowAddNew ? 'Press Enter to add as a new year' : 'No matching year found',
  };

  async function fetchYearsfromCosmos() {
    try {
      const response = await getAllYears();
      var newYears: ITag[] = [];
      response.years.forEach((year: string) => {
        const trimmedYear = year.trim();
        if (trimmedYear !== "" && !newYears.some(t => t.key === trimmedYear)) {
          const newYear: any = { key: trimmedYear, name: trimmedYear, isNewItem: false };
          newYears.push(newYear);
        }
      });
      setYears(newYears);
      if (preSelectedYears !== undefined && preSelectedYears.length > 0) {
        setSelectedYears(preSelectedYears);
        onSelectedYearsChange(preSelectedYears);
      }
      else {
        setSelectedYears([]);
        onSelectedYearsChange([]);
      }
    }
    catch (error) {
      console.log(error);
    }
  }

  const onChange = (items?: ITag[] | undefined) => {
    if (items) {
      setSelectedYears(items);
      onSelectedYearsChange(items);
    }
  };

  useEffect(() => {
    fetchYearsfromCosmos();
  }, []);

  return (
    <div className={hide ? styles.hide : styles.yearArea}>
      <div className={styles.yearSelection}>
        <div className={allowAddNew ? styles.rootClass : styles.rootClassFilter}>
          <label htmlFor={pickerId}><>Years</>  <TooltipHost content={allowAddNew ? "Years to append to each document uploaded below." : "Years to filter documents by."}
            styles={hostStyles}
            id={tooltipId}>
            <Info16Regular></Info16Regular>
          </TooltipHost></label>
          <TagPicker
            className={styles.yearPicker}
            removeButtonAriaLabel="Remove"
            selectionAriaLabel="Existing years"
            onResolveSuggestions={filterSuggestedYears}
            onRenderSuggestionsItem={onRenderSuggestionsItem}
            getTextFromItem={getTextFromItem}
            pickerSuggestionsProps={pickerSuggestionsProps}
            itemLimit={10}
            // this option tells the picker's callout to render inline instead of in a new layer
            pickerCalloutProps={{ doNotLayer: false }}
            inputProps={{
              id: pickerId
            }}
            onItemSelected={onItemSelected}
            selectedItems={selectedYears}
            onChange={onChange}
          />
        </div>

      </div>
    </div>
  );
};
